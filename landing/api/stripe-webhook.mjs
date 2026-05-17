import Stripe from "stripe";

// Lazy init — STRIPE_SECRET_KEY may not be set yet at module load time
let _stripe = null;
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw Object.assign(new Error("STRIPE_SECRET_KEY not configured"), { status: 500 });
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Map Stripe price IDs → plan names (configured via env)
function buildPriceMap() {
  const map = {};
  if (process.env.STRIPE_PRICE_ID_PREMIUM) map[process.env.STRIPE_PRICE_ID_PREMIUM] = "PREMIUM";
  if (process.env.STRIPE_PRICE_ID_PRO) map[process.env.STRIPE_PRICE_ID_PRO] = "PRO";
  return map;
}

export async function handleStripeWebhook(rawBody, signature, db, saveDb) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw Object.assign(new Error("STRIPE_WEBHOOK_SECRET not configured"), { status: 500 });

  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw Object.assign(new Error(`Webhook signature verification failed: ${err.message}`), { status: 400 });
  }

  // Subscription actually ended (reached the cancel_at_period_end date, or
  // was cancelled in Stripe) → downgrade the instance to FREE.
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const account = db.accounts.find((a) => a.stripeSubscriptionId === subscription.id);
    if (!account) {
      return { ignored: true, reason: "no_account_for_subscription", subscriptionId: subscription.id };
    }
    const res = await fetch(`${account.url ?? `http://${account.slug}`}/api/instance/plan`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account.deleteToken}`,
      },
      body: JSON.stringify({ planId: "FREE" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Instance plan downgrade failed (${res.status}): ${body.error ?? "unknown"}`);
    }
    account.planId = "FREE";
    account.stripeSubscriptionId = null;
    account.cancelAtPeriodEnd = false;
    await saveDb(db);
    console.log(`[stripe-webhook] Subscription ended, downgraded to FREE: ${account.slug}`);
    return { ok: true, slug: account.slug, planId: "FREE" };
  }

  if (event.type !== "checkout.session.completed") {
    return { ignored: true, type: event.type };
  }

  const session = event.data.object;
  const slug = session.client_reference_id;
  if (!slug) throw new Error("Missing client_reference_id in session");

  // Resolve price → plan
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
  const priceId = lineItems.data[0]?.price?.id;
  const PRICE_MAP = buildPriceMap();
  const planId = PRICE_MAP[priceId];

  if (!planId) {
    console.warn(`[stripe-webhook] Unknown price ID: ${priceId} for slug ${slug}`);
    return { ignored: true, reason: "unknown_price", priceId };
  }

  // Find the instance
  const account = db.accounts.find((a) => a.slug === slug);
  if (!account) throw new Error(`Instance not found for slug: ${slug}`);

  // Call the instance API to update planId
  const instanceUrl = account.url ?? `http://${slug}`;
  const token = account.deleteToken;

  const res = await fetch(`${instanceUrl}/api/instance/plan`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Instance plan update failed (${res.status}): ${body.error ?? "unknown"}`);
  }

  // Mirror the change in db.json (save subscription + customer IDs for future cancellation)
  account.planId = planId;
  account.cancelAtPeriodEnd = false;
  if (session.subscription) account.stripeSubscriptionId = session.subscription;
  if (session.customer) account.stripeCustomerId = session.customer;
  await saveDb(db);

  console.log(`[stripe-webhook] Plan updated: ${slug} → ${planId}`);
  return { ok: true, slug, planId };
}
