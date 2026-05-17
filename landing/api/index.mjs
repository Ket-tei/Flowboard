import "dotenv/config";
import http from "node:http";
import { PORT, DB_PATH, buildInstanceUrl, buildRedirectUrl } from "./config.mjs";
import { loadDb, saveDb } from "./db.mjs";
import { provisionInstance, deprovisionInstance, startInstance } from "./provisioner.mjs";
import { checkHostResources } from "./resources.mjs";
import { sendResourceAlert, sendProvisioningFailureAlert } from "./mailer.mjs";
import { handleStripeWebhook } from "./stripe-webhook.mjs";
import Stripe from "stripe";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Slugs whose wake (docker compose up) is in progress, to make /api/wake
// idempotent under the burst of requests a refreshing browser produces.
const waking = new Set();

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html),
    "Cache-Control": "no-store",
    "Retry-After": "12",
  });
  res.end(html);
}

function wakingPage(slug) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta http-equiv="refresh" content="12"><title>Réveil en cours…</title>` +
    `<style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;` +
    `display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}` +
    `.c{max-width:30rem;padding:2rem}h1{font-size:1.4rem;margin:0 0 .75rem}` +
    `p{color:#94a3b8;line-height:1.5}.s{width:2.5rem;height:2.5rem;margin:0 auto 1.5rem;` +
    `border:3px solid #1e293b;border-top-color:#38bdf8;border-radius:50%;animation:r 1s linear infinite}` +
    `@keyframes r{to{transform:rotate(360deg)}}</style></head><body><div class="c">` +
    `<div class="s"></div><h1>Réveil de votre espace…</h1>` +
    `<p>Votre instance <strong>${slug}</strong> était en veille faute d'activité. ` +
    `Elle redémarre — cette page se rafraîchit automatiquement dans quelques secondes.</p>` +
    `</div></body></html>`;
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error("Body too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function parseJsonBody(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return null;
  }
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

function validateInstanceInput({ slug, email, password, accounts }) {
  const errors = {};

  if (!SLUG_RE.test(slug)) {
    errors.slug = "invalid";
  } else if (accounts.some((account) => normalizeSlug(account.slug) === slug)) {
    errors.slug = "taken";
  }

  if (!EMAIL_RE.test(email)) {
    errors.email = "invalid";
  } else if (accounts.some((account) => normalizeEmail(account.email) === email)) {
    errors.email = "taken";
  }

  if (String(password ?? "").length < 6) {
    errors.password = "too_short";
  }

  return errors;
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) return sendJson(res, 400, { error: "Bad Request" });

    if (req.method === "OPTIONS") return sendJson(res, 204, {});

    if (req.url === "/api/health" && req.method === "GET") {
      return sendJson(res, 200, { ok: true });
    }

    // On-demand wake — proxied here by the gateway when a sleeping instance's
    // upstream is unreachable. Boots the instance (idempotent) and serves a
    // self-refreshing waiting page until the containers are back.
    if (req.url?.startsWith("/api/wake/") && req.method === "GET") {
      const slug = req.url.replace("/api/wake/", "").replace(/\/$/, "");
      const { accounts } = await loadDb();
      const account = accounts.find((a) => a.slug === slug);
      if (!account) return sendJson(res, 404, { error: "Not found" });

      if (account.sleepState === "sleeping" && !waking.has(slug)) {
        waking.add(slug);
        startInstance(slug)
          .then(async () => {
            const db = await loadDb();
            const a = db.accounts.find((x) => x.slug === slug);
            if (a) {
              a.sleepState = "awake";
              a.status = "ready";
              delete a.sleptAt;
              await saveDb(db);
            }
            console.log(`[wake] ${slug} woke up`);
          })
          .catch((err) => console.error(`[wake] ${slug} failed:`, err))
          .finally(() => waking.delete(slug));
      }

      return sendHtml(res, 503, wakingPage(slug));
    }

    if (req.url === "/api/login" && req.method === "POST") {
      const raw = await readBody(req);
      const payload = parseJsonBody(raw);
      if (!payload) {
        return sendJson(res, 400, { error: "Invalid JSON" });
      }

      const email = normalizeEmail(payload.email);
      if (!email) return sendJson(res, 400, { error: "Missing email" });

      const { accounts } = await loadDb();
      const match = accounts.find((a) => normalizeEmail(a.email) === email);
      if (!match?.url) return sendJson(res, 404, { error: "Not found" });

      const redirectUrl = buildRedirectUrl(match.slug, match.planId);
      return sendJson(res, 200, { url: match.url, redirectUrl });
    }

    if (req.url === "/api/instances" && req.method === "POST") {
      const raw = await readBody(req);
      const payload = parseJsonBody(raw);
      if (!payload) {
        return sendJson(res, 400, { error: "Invalid JSON" });
      }

      const slug = normalizeSlug(payload.slug);
      const email = normalizeEmail(payload.email);
      const password = String(payload.password ?? "");
      const requestedPlan = String(payload.planId ?? "FREE");
      // Plans are always provisioned as FREE; users upgrade via the billing page after creation.
      const planId = "FREE";

      const resources = await checkHostResources();
      if (!resources.ok) {
        sendResourceAlert({ ...resources, slug: slug || "unknown", email: email || "unknown" }).catch(() => {});
        return sendJson(res, 503, {
          error: "INSUFFICIENT_RESOURCES",
          message: "Création impossible : ressources serveur insuffisantes. Veuillez réessayer plus tard.",
        });
      }

      const db = await loadDb();
      const fieldErrors = validateInstanceInput({
        slug,
        email,
        password,
        accounts: db.accounts,
      });

      if (Object.keys(fieldErrors).length > 0) {
        return sendJson(res, 409, { error: "Validation failed", fieldErrors });
      }

      const account = {
        slug,
        email,
        planId,
        status: "creating",
        url: buildInstanceUrl(slug),
        createdAt: new Date().toISOString(),
      };

      db.accounts.push(account);
      await saveDb(db);

      let provisionResult;
      try {
        provisionResult = await provisionInstance({ slug, email, password, planId });
      } catch (err) {
        const errorMsg = String(err.message ?? err);
        db.accounts = db.accounts.filter((a) => a.slug !== slug);
        await saveDb(db);
        sendProvisioningFailureAlert({ slug, email, planId, error: errorMsg }).catch(() => {});
        return sendJson(res, 500, {
          error: "Provisioning failed",
          message: errorMsg,
          status: "failed",
        });
      }

      account.status = "ready";
      account.url = provisionResult.url;
      account.projectName = provisionResult.projectName;
      account.deleteToken = provisionResult.deleteToken;
      await saveDb(db);

      const redirectUrl = buildRedirectUrl(slug, requestedPlan);
      return sendJson(res, 201, {
        url: account.url,
        redirectUrl,
        status: "ready",
      });
    }

    if (req.url?.startsWith("/api/instances/") && req.method === "GET") {
      const slug = req.url.replace("/api/instances/", "").replace(/\/$/, "");
      const { accounts } = await loadDb();
      const match = accounts.find((a) => a.slug === slug);
      if (!match) return sendJson(res, 404, { error: "Not found" });
      return sendJson(res, 200, {
        slug: match.slug,
        url: match.url,
        status: match.status ?? "unknown",
        planId: match.planId,
      });
    }

    if (req.url?.startsWith("/api/instances/") && req.method === "DELETE") {
      const slug = req.url.replace("/api/instances/", "").replace(/\/$/, "");
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

      const { accounts } = await loadDb();
      const match = accounts.find((a) => a.slug === slug);
      if (!match) return sendJson(res, 404, { error: "Not found" });
      if (!token || !match.deleteToken || token !== match.deleteToken) {
        return sendJson(res, 403, { error: "Forbidden" });
      }

      sendJson(res, 202, { status: "deleting" });

      const db = await loadDb();
      const idx = db.accounts.findIndex((a) => a.slug === slug);
      if (idx !== -1) { db.accounts[idx].status = "deleting"; await saveDb(db); }

      deprovisionInstance({ slug })
        .then(async () => {
          const db2 = await loadDb();
          db2.accounts = db2.accounts.filter((a) => a.slug !== slug);
          await saveDb(db2);
          console.log(`[landing-api] Instance ${slug} deprovisioned.`);
        })
        .catch((err) => console.error(`[landing-api] Deprovisioning ${slug} failed:`, err));
      return;
    }

    // Subscription info — used by the cancel-confirmation popup to show the
    // exact date the plan will revert to FREE.
    if (req.url?.match(/^\/api\/instances\/[^/]+\/subscription$/) && req.method === "GET") {
      const slug = req.url.split("/")[3];
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
      const db = await loadDb();
      const account = db.accounts.find((a) => a.slug === slug);
      if (!account) return sendJson(res, 404, { error: "Not found" });
      if (!token || !account.deleteToken || token !== account.deleteToken) {
        return sendJson(res, 403, { error: "Forbidden" });
      }
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!account.stripeSubscriptionId || !stripeKey) {
        return sendJson(res, 200, { stripe: false });
      }
      try {
        const stripe = new Stripe(stripeKey);
        const sub = await stripe.subscriptions.retrieve(account.stripeSubscriptionId);
        const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
        return sendJson(res, 200, {
          stripe: true,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        });
      } catch (err) {
        console.error("[subscription] Stripe error:", err.message);
        return sendJson(res, 200, { stripe: false });
      }
    }

    // Cancel subscription — authenticated with deleteToken.
    // Stripe-paid plans: schedule cancellation at period end (keep access
    // until then, no refund). Manual/script plans: downgrade now.
    if (req.url?.match(/^\/api\/instances\/[^/]+\/cancel-subscription$/) && req.method === "POST") {
      const slug = req.url.split("/")[3];
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

      const db = await loadDb();
      const account = db.accounts.find((a) => a.slug === slug);
      if (!account) return sendJson(res, 404, { error: "Not found" });
      if (!token || !account.deleteToken || token !== account.deleteToken) {
        return sendJson(res, 403, { error: "Forbidden" });
      }

      if (account.stripeSubscriptionId) {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) return sendJson(res, 500, { error: "Stripe not configured" });
        const stripe = new Stripe(stripeKey);
        let sub;
        try {
          sub = await stripe.subscriptions.update(account.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
        } catch (err) {
          console.error("[cancel-subscription] Stripe error:", err.message);
          return sendJson(res, 500, { error: `Stripe error: ${err.message}` });
        }
        const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
        account.cancelAtPeriodEnd = true;
        await saveDb(db);
        console.log(`[cancel-subscription] ${slug} scheduled to cancel at period end (${periodEnd})`);
        return sendJson(res, 200, { ok: true, mode: "period_end", currentPeriodEnd: periodEnd });
      }

      // No Stripe subscription (manual/script plan) — downgrade immediately.
      try {
        const res2 = await fetch(`${account.url}/api/instance/plan`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${account.deleteToken}`,
          },
          body: JSON.stringify({ planId: "FREE" }),
        });
        if (!res2.ok) {
          const body = await res2.json().catch(() => ({}));
          console.error("[cancel-subscription] Plan reset failed:", body.error);
        }
      } catch (err) {
        console.error("[cancel-subscription] Plan reset error:", err.message);
      }

      account.planId = "FREE";
      account.stripeSubscriptionId = null;
      await saveDb(db);

      console.log(`[cancel-subscription] ${slug} downgraded to FREE immediately`);
      return sendJson(res, 200, { ok: true, mode: "immediate", planId: "FREE" });
    }

    // Stripe webhook — raw body required for signature verification
    if (req.url === "/api/stripe-webhook" && req.method === "POST") {
      const rawBody = await readBody(req);
      const signature = req.headers["stripe-signature"];
      if (!signature) return sendJson(res, 400, { error: "Missing stripe-signature header" });
      try {
        const db = await loadDb();
        const result = await handleStripeWebhook(rawBody, signature, db, saveDb);
        return sendJson(res, 200, result);
      } catch (err) {
        console.error("[stripe-webhook]", err.message);
        return sendJson(res, err.status ?? 500, { error: err.message });
      }
    }

    return sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("[landing-api] Error:", err);
    return sendJson(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`[landing-api] listening on http://localhost:${PORT}`);
  console.log(`[landing-api] DB_PATH=${DB_PATH}`);
});
