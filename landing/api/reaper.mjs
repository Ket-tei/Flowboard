// Idle-instance reaper (FREE plan only). Run periodically (cron / systemd
// timer). Two transitions:
//   1. awake + no traffic for SLEEP_AFTER_MS  -> stop containers ("sleeping")
//   2. sleeping for DELETE_AFTER_SLEEP_MS     -> deprovision + free slug/email
//
// "Last activity" = mtime of the per-instance nginx access log written by the
// gateway (landing/api/gateway/logs/<slug>.log). Falls back to createdAt when
// the log does not exist yet.
import "dotenv/config";
import { stat } from "node:fs/promises";
import path from "node:path";
import { loadDb, saveDb } from "./db.mjs";
import { SLEEP_AFTER_MS, DELETE_AFTER_SLEEP_MS } from "./config.mjs";
import {
  stopInstance,
  deprovisionInstance,
  GATEWAY_LOGS_DIR,
} from "./provisioner.mjs";
import { sendInstanceDeletedAlert } from "./mailer.mjs";

async function lastActivityMs(account) {
  try {
    const s = await stat(path.join(GATEWAY_LOGS_DIR, `${account.slug}.log`));
    return s.mtimeMs;
  } catch {
    return new Date(account.createdAt ?? 0).getTime();
  }
}

async function run() {
  const now = Date.now();
  const { accounts } = await loadDb();

  for (const account of accounts) {
    const { slug, planId, status } = account;
    if (planId !== "FREE") continue;
    if (status === "creating" || status === "deleting") continue;

    if (account.sleepState === "sleeping") {
      const sleptAt = Date.parse(account.sleptAt ?? "") || now;
      if (now - sleptAt < DELETE_AFTER_SLEEP_MS) continue;

      console.log(`[reaper] deleting ${slug} (asleep > ${DELETE_AFTER_SLEEP_MS}ms)`);
      try {
        await deprovisionInstance({ slug });
        const db = await loadDb();
        db.accounts = db.accounts.filter((a) => a.slug !== slug);
        await saveDb(db);
        await sendInstanceDeletedAlert({ slug, email: account.email });
        console.log(`[reaper] ${slug} deleted, slug/email freed`);
      } catch (err) {
        console.error(`[reaper] delete ${slug} failed:`, err.message ?? err);
      }
      continue;
    }

    const idleFor = now - (await lastActivityMs(account));
    if (idleFor < SLEEP_AFTER_MS) continue;

    console.log(`[reaper] sleeping ${slug} (idle ${Math.round(idleFor / 3600000)}h)`);
    try {
      await stopInstance(slug);
      const db = await loadDb();
      const a = db.accounts.find((x) => x.slug === slug);
      if (a) {
        a.sleepState = "sleeping";
        a.sleptAt = new Date(now).toISOString();
        a.status = "sleeping";
        await saveDb(db);
      }
      console.log(`[reaper] ${slug} put to sleep`);
    } catch (err) {
      console.error(`[reaper] sleep ${slug} failed:`, err.message ?? err);
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[reaper] fatal:", err);
    process.exit(1);
  });
