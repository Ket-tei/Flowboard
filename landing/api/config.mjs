import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = Number(process.env.PORT ?? 8787);
export const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, "db.json");

export const BASE_HOST = process.env.INSTANCE_BASE_HOST ?? "localhost";
export const BASE_PROTOCOL = process.env.INSTANCE_PROTOCOL ?? "http";

export const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, "..", "..");
export const INSTANCES_DIR = process.env.INSTANCES_DIR ?? path.join(__dirname, "instances");

export const GATEWAY_NETWORK = "flowboard_gateway";

export function buildInstanceUrl(slug) {
  const host = `${slug}.${BASE_HOST}`;
  return `${BASE_PROTOCOL}://${host}`;
}

export function buildRedirectUrl(slug, planId) {
  const base = buildInstanceUrl(slug);
  if (planId === "FREE") return `${base}/app/dashboard`;
  return `${base}/app/billing`;
}
