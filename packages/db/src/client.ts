import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

/**
 * Create a Drizzle client over a postgres.js connection.
 *
 * Server-side only. This connects with the pooled `DATABASE_URL` (service
 * role), so it BYPASSES Postgres RLS — every query MUST be scoped to the
 * owning user. Do not query through this client directly from feature code;
 * go through `scopedDb(userId)` (see scoped.ts) so ownership filters are
 * applied for you. That indirection is the fix for the RLS-bypass footgun
 * called out in the spec review.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

let cached: Database | undefined;

/**
 * Lazily-constructed singleton client from `process.env.DATABASE_URL`.
 * Throws if the env var is missing so misconfiguration fails loudly at first
 * use rather than silently connecting to nothing.
 */
export function getDb(): Database {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — cannot create the database client.",
    );
  }
  cached = createDb(url);
  return cached;
}
