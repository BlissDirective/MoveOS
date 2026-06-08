-- Supabase-specific migration, applied AFTER the drizzle-kit migration.
--
-- Two things drizzle-kit can't express:
--   1. The cross-schema FK from user_profiles.id to auth.users(id).
--   2. Row-Level Security. The app reaches Postgres with the service role
--      (which bypasses RLS) and enforces ownership in code via scopedDb().
--      These policies are defense-in-depth: if a query ever runs under an
--      end-user JWT (e.g. Supabase client), the database still refuses
--      cross-tenant reads. scopedDb() remains the primary guard.

-- 1. Tie profiles to auth.users.
ALTER TABLE "user_profiles"
  ADD CONSTRAINT "user_profiles_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- 2. Enable RLS on every tenant table.
ALTER TABLE "user_profiles"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "moves"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_tasks"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "approval_items" ENABLE ROW LEVEL SECURITY;

-- Owner can see/manage their own profile.
CREATE POLICY "own_profile" ON "user_profiles"
  USING ("id" = auth.uid()) WITH CHECK ("id" = auth.uid());

-- Owner can see/manage their own moves.
CREATE POLICY "own_moves" ON "moves"
  USING ("user_id" = auth.uid()) WITH CHECK ("user_id" = auth.uid());

-- Children are reachable only through an owned move.
CREATE POLICY "own_tasks" ON "tasks"
  USING ("move_id" IN (SELECT "id" FROM "moves" WHERE "user_id" = auth.uid()))
  WITH CHECK ("move_id" IN (SELECT "id" FROM "moves" WHERE "user_id" = auth.uid()));

CREATE POLICY "own_agent_tasks" ON "agent_tasks"
  USING ("move_id" IN (SELECT "id" FROM "moves" WHERE "user_id" = auth.uid()))
  WITH CHECK ("move_id" IN (SELECT "id" FROM "moves" WHERE "user_id" = auth.uid()));

CREATE POLICY "own_approval_items" ON "approval_items"
  USING ("move_id" IN (SELECT "id" FROM "moves" WHERE "user_id" = auth.uid()))
  WITH CHECK ("move_id" IN (SELECT "id" FROM "moves" WHERE "user_id" = auth.uid()));
