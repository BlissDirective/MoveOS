import { scopedDb, type Database, type ScopedDb } from "@moveros/db";
import { getUserIdFromToken } from "./auth";

/**
 * Domain events a resolver can emit. The interface lives here so tRPC stays
 * decoupled from @moveros/agents; the Next route handler injects an
 * implementation backed by the Inngest client. Defaults to no-ops.
 */
export interface AppEvents {
  moveCreated(data: { moveId: string; userId: string }): Promise<void>;
  approvalApproved(data: {
    approvalId: string;
    moveId: string;
    userId: string;
  }): Promise<void>;
  quotesRequested(data: { moveId: string; userId: string }): Promise<void>;
  internetRequested(data: { moveId: string; userId: string }): Promise<void>;
  utilitiesRequested(data: { moveId: string; userId: string }): Promise<void>;
  servicesRequested(data: { moveId: string; userId: string }): Promise<void>;
}

const noopEvents: AppEvents = {
  async moveCreated() {
    /* no-op when no emitter is wired (tests, build) */
  },
  async approvalApproved() {
    /* no-op */
  },
  async quotesRequested() {
    /* no-op */
  },
  async internetRequested() {
    /* no-op */
  },
  async utilitiesRequested() {
    /* no-op */
  },
  async servicesRequested() {
    /* no-op */
  },
};

/**
 * Request context shared by every procedure. `scoped` is non-null exactly when
 * `userId` is — protectedProcedure narrows both so resolvers never touch the
 * unscoped client.
 */
export interface Context {
  readonly db: Database;
  readonly userId: string | null;
  readonly scoped: ScopedDb | null;
  readonly events: AppEvents;
}

/** Build a context from an already-resolved user (used directly in tests). */
export function createInnerContext(
  db: Database,
  userId: string | null,
  events: AppEvents = noopEvents,
): Context {
  return { db, userId, scoped: userId ? scopedDb(db, userId) : null, events };
}

export interface CreateContextOptions {
  readonly db: Database;
  readonly headers: Headers;
  readonly events?: AppEvents;
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
  return createInnerContext(opts.db, userId, opts.events);
}
