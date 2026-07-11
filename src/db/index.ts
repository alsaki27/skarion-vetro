import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? "";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!DATABASE_URL) return null;
  if (!db) {
    const sql = neon(DATABASE_URL);
    db = drizzle(sql, { schema });
  }
  return db;
}

export { schema };
