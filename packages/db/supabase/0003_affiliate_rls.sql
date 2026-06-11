-- Supabase-specific migration, applied AFTER migrations/0001_long_norrin_radd.sql.
-- RLS for affiliate_events, matching the defense-in-depth posture of
-- 0001_auth_fk_rls.sql: the app reaches Postgres with the service role and
-- enforces ownership in code via scopedDb(); these policies guard any future
-- end-user-JWT access path.

ALTER TABLE "affiliate_events" ENABLE ROW LEVEL SECURITY;

-- Owner can see/manage their own affiliate events.
CREATE POLICY "own_affiliate_events" ON "affiliate_events"
  USING ("user_id" = auth.uid()) WITH CHECK ("user_id" = auth.uid());
