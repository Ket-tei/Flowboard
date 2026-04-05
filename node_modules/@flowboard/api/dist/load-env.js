import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
/** Charge `apps/api/.env` quel que soit le cwd (racine du repo ou `apps/api`). */
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });
