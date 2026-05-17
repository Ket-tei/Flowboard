import "dotenv/config";
import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { PORT, DB_PATH, buildInstanceUrl, buildRedirectUrl } from "./config.mjs";
import { provisionInstance, deprovisionInstance } from "./provisioner.mjs";
import { checkHostResources } from "./resources.mjs";
import { sendResourceAlert, sendProvisioningFailureAlert } from "./mailer.mjs";
import { handleStripeWebhook } from "./stripe-webhook.mjs";
import Stripe from "stripe";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function loadDb() {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const accounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
    return { accounts };
  } catch {
    return { accounts: [] };
  }
}

async function saveDb(db) {
  await writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
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

    // Cancel Stripe subscription — authenticated with deleteToken
    if (req.url?.match(/^\/api\/instances\/[^/]+\/cancel-subscription$/) && req.method === "POST") {
      const slug = req.url.split("/")[3];
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

      const db = await loadDb();
      const account = db.accounts.find((a) => a.slug === slug);
      if (!account) return sendJson(res, 404, { error: "Not found" });
      if (!token || !account.deleteToken || token !== account.deleteToken) {
        return sendJson(res, 403, { error: "Forbidden" });
      }

      // Plans set manually (via set-plan.sh) or never paid have no Stripe
      // subscription — cancellation just downgrades to FREE without Stripe.
      if (account.stripeSubscriptionId) {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) return sendJson(res, 500, { error: "Stripe not configured" });
        const stripe = new Stripe(stripeKey);
        try {
          await stripe.subscriptions.cancel(account.stripeSubscriptionId);
        } catch (err) {
          console.error("[cancel-subscription] Stripe error:", err.message);
          return sendJson(res, 500, { error: `Stripe error: ${err.message}` });
        }
      }

      // Reset plan to FREE on the instance
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

      console.log(`[cancel-subscription] Subscription cancelled: ${slug}`);
      return sendJson(res, 200, { ok: true, planId: "FREE" });
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
