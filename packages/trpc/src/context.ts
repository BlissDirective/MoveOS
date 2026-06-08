import { scopedDb, type Database, type ScopedDb } from "@moveros/db";
import { getUserIdFromToken } from "./auth";

/**
 * Request context shared by every procedure. `scoped` is non-null exactly when
 * `userId` is — protectedProcedure narrows both so resolvers never touch the
 * unscoped client.
 */
export interface Context {
  readonly db: Database;
  readonly userId: string | null;
  readonly scoped: ScopedDb | null;
}

/** Build a context from an already-resolved user (used directly in tests). */
export function createInnerContext(db: Database, userId: string | null): Context {
  return { db, userId, scoped: userId ? scopedDb(db, userId) : null };
}

export interface CreateContextOptions {
  readonly db: Database;
  readonly headers: Headers;
}

/**
 * Build a context from an incoming request: pull the bearer token, resolve the
 * user via Supabase, and scope the db to them. Called by the Next.js route
 * handler that serves the tRPC API.
 */
export async function createTRPCContext(
  opts: CreateContextOptions,
): Promise<Context> {
  const header = opts.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice("bearer ".length).trim()
    : null;
  const userId = token ? await getUserIdFromToken(token) : null;
  return createInnerContext(opts.db, userId);
}
