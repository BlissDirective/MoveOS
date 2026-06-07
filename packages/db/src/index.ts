// @moveros/db — Drizzle schema + Supabase client + integrations.
// Phase 1 adds: core schema (user_profiles, moves, tasks, agent_tasks,
// approval_items), a scopedDb(userId) repository pattern (RLS footgun fix),
// and migrations. Placeholder export keeps the package type-checkable.

export const DB_PACKAGE = "@moveros/db" as const;
