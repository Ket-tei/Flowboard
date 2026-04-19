import { execFile } from "node:child_process";
import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  APP_ROOT,
  INSTANCES_DIR,
  BASE_PROTOCOL,
  BASE_HOST,
  GATEWAY_NETWORK,
  buildInstanceUrl,
} from "./config.mjs";

const __provisionerDir = path.dirname(fileURLToPath(import.meta.url));
const GATEWAY_DIR = path.join(__provisionerDir, "gateway");
const GATEWAY_INSTANCES_DIR = path.join(GATEWAY_DIR, "instances");

function exec(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 300_000, ...opts }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

function randomSecret(len = 64) {
  return crypto.randomBytes(len).toString("hex").slice(0, len);
}

async function renderTemplate(slug, vars) {
  const tplPath = path.join(__provisionerDir, "instance-template", "docker-compose.yml.tpl");
  let tpl = await readFile(tplPath, "utf8");
  for (const [key, value] of Object.entries(vars)) {
    tpl = tpl.replaceAll(`{{${key}}}`, value);
  }
  return tpl;
}

export async function provisionInstance({ slug, email, password, planId }) {
  const projectName = `fb-${slug}`;
  const instanceDir = path.join(INSTANCES_DIR, slug);
  await mkdir(instanceDir, { recursive: true });

  const dbPassword = randomSecret(32);
  const jwtSecret = randomSecret(64);
  const dbName = `fb_${slug.replace(/-/g, "_")}`;
  const dbUser = `fb_${slug.replace(/-/g, "_")}`;
  const origin = buildInstanceUrl(slug);

  const deleteToken = randomSecret(32);

  const vars = {
    MYSQL_ROOT_PASSWORD: randomSecret(32),
    MYSQL_DATABASE: dbName,
    MYSQL_USER: dbUser,
    MYSQL_PASSWORD: dbPassword,
    JWT_SECRET: jwtSecret,
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
    CORS_ORIGIN: origin,
    APP_ROOT: APP_ROOT.replace(/\\/g, "/"),
    INSTANCE_SLUG: slug,
    INSTANCE_DELETE_TOKEN: deleteToken,
    LANDING_API_URL: `${BASE_PROTOCOL}://${BASE_HOST}`,
  };

  const composeContent = await renderTemplate(slug, vars);
  const composePath = path.join(instanceDir, "docker-compose.yml");
  await writeFile(composePath, composeContent, "utf8");

  const envContent = Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  await writeFile(path.join(instanceDir, ".env"), envContent + "\n", "utf8");

  await ensureGatewayNetwork();

  await exec("docker", ["compose", "-p", projectName, "-f", composePath, "build"], {
    cwd: APP_ROOT,
  });

  await exec("docker", ["compose", "-p", projectName, "-f", composePath, "up", "-d"], {
    cwd: APP_ROOT,
  });

  await waitForHealthy(projectName, composePath);

  await registerInGateway(slug, projectName);

  return { url: origin, projectName, deleteToken };
}

export async function deprovisionInstance({ slug }) {
  const instanceDir = path.join(INSTANCES_DIR, slug);

  // Stop & remove all containers for both possible project names (label-based, no compose file needed)
  for (const project of [`fb-${slug}`, slug]) {
    try {
      const { stdout } = await exec("docker", [
        "ps", "-aq", "--filter", `label=com.docker.compose.project=${project}`,
      ]);
      const ids = stdout.trim().split("\n").filter(Boolean);
      if (ids.length > 0) {
        await exec("docker", ["stop", ...ids]);
        await exec("docker", ["rm", "-v", ...ids]);
        console.log(`[deprovisioner] stopped ${ids.length} container(s) for project ${project}`);
      }
    } catch (err) {
      console.warn(`[deprovisioner] container cleanup failed for ${project}:`, err.message);
    }

    // Remove associated volumes
    try {
      const { stdout } = await exec("docker", [
        "volume", "ls", "-q", "--filter", `label=com.docker.compose.project=${project}`,
      ]);
      const vols = stdout.trim().split("\n").filter(Boolean);
      if (vols.length > 0) {
        await exec("docker", ["volume", "rm", ...vols]);
        console.log(`[deprovisioner] removed ${vols.length} volume(s) for project ${project}`);
      }
    } catch (err) {
      console.warn(`[deprovisioner] volume cleanup failed for ${project}:`, err.message);
    }
  }

  const gatewayConf = path.join(GATEWAY_INSTANCES_DIR, `${slug}.conf`);
  try { await unlink(gatewayConf); } catch {}

  await reloadGateway();

  try { await rm(instanceDir, { recursive: true, force: true }); } catch {}
}

async function registerInGateway(slug, projectName) {
  await mkdir(GATEWAY_INSTANCES_DIR, { recursive: true });

  const webContainer = `${projectName}-web-1`;
  const serverName = `${slug}.${BASE_HOST}`;

  const nginxConf = [
    `server {`,
    `    listen 80;`,
    `    server_name ${serverName};`,
    ``,
    `    location / {`,
    `        set $upstream http://${webContainer}:80;`,
    `        proxy_pass $upstream;`,
    `        proxy_http_version 1.1;`,
    `        proxy_set_header Host $host;`,
    `        proxy_set_header X-Real-IP $remote_addr;`,
    `        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`,
    `        proxy_set_header X-Forwarded-Proto $scheme;`,
    `    }`,
    `}`,
    ``,
  ].join("\n");

  await writeFile(path.join(GATEWAY_INSTANCES_DIR, `${slug}.conf`), nginxConf, "utf8");

  await reloadGateway();
}

async function reloadGateway() {
  try {
    await exec("docker", [
      "compose",
      "-f",
      path.join(GATEWAY_DIR, "docker-compose.yml"),
      "exec",
      "gateway",
      "nginx",
      "-s",
      "reload",
    ]);
  } catch {
    console.log("[provisioner] Gateway not running, starting it...");
    await exec("docker", [
      "compose",
      "-f",
      path.join(GATEWAY_DIR, "docker-compose.yml"),
      "up",
      "-d",
    ]);
  }
}

async function ensureGatewayNetwork() {
  try {
    await exec("docker", ["network", "inspect", GATEWAY_NETWORK]);
  } catch {
    await exec("docker", ["network", "create", GATEWAY_NETWORK]);
  }
}

async function waitForHealthy(projectName, composePath, maxWaitMs = 120_000) {
  const start = Date.now();
  const interval = 3000;

  while (Date.now() - start < maxWaitMs) {
    try {
      const { stdout } = await exec("docker", [
        "compose",
        "-p",
        projectName,
        "-f",
        composePath,
        "ps",
        "--format",
        "json",
      ]);

      const lines = stdout.trim().split("\n").filter(Boolean);
      const containers = lines.map((l) => JSON.parse(l));

      const allRunning = containers.length >= 3 && containers.every((c) => c.State === "running");
      if (allRunning) return;
    } catch {
      // retry
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`Instance ${projectName} did not become healthy within ${maxWaitMs / 1000}s`);
}

export async function getInstanceStatus(slug) {
  const projectName = `fb-${slug}`;
  const instanceDir = path.join(INSTANCES_DIR, slug);
  const composePath = path.join(instanceDir, "docker-compose.yml");

  try {
    const { stdout } = await exec("docker", [
      "compose",
      "-p",
      projectName,
      "-f",
      composePath,
      "ps",
      "--format",
      "json",
    ]);
    const lines = stdout.trim().split("\n").filter(Boolean);
    const containers = lines.map((l) => JSON.parse(l));
    const allRunning = containers.length >= 3 && containers.every((c) => c.State === "running");
    return allRunning ? "ready" : "degraded";
  } catch {
    return "stopped";
  }
}
