// @moveros/db — Drizzle schema + scoped client for MoverOS.
//
// Phase 1 increment 2 delivers:
//   • Core schema: user_profiles, moves, tasks, agent_tasks, approval_items.
//   • createDb/getDb — the service-role Drizzle client (bypasses RLS).
//   • scopedDb(db, userId) — the repository pattern that bakes ownership
//     filters into every read (the RLS-bypass footgun fix from the review).

export * as schema from "./schema";
export * from "./schema";
export { createDb, getDb } from "./client";
export type { Database } from "./client";
export { scopedDb, NotOwnedError } from "./scoped";
export type { ScopedDb, CreateMoveInput } from "./scoped";
