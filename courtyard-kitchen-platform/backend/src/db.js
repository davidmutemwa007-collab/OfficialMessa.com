import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Start the local database with docker compose or set a PostgreSQL connection string.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render's private Postgres URL accepts internal connections without public TLS.
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000
});

export async function query(text, params = []) {
  return pool.query(text, params);
}
