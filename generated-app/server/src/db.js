import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

// In-memory Postgres 16 — no external server needed
const db = new PGlite();

// Thin wrapper matching the pg Pool API used throughout index.js
export const pool = {
  async query(sql, params) {
    return db.query(sql, params);
  },
};

export async function initDb() {
  const schemaSql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  const seedSql = await readFile(new URL("./seed.sql", import.meta.url), "utf8");
  await db.exec(schemaSql);
  await db.exec(seedSql);
  console.log("✅ In-memory DB ready (PGlite — Postgres 16 WASM)");
}
