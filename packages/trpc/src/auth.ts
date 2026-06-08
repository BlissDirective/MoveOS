import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | undefined;

/**
 * A stateless Supabase client used only to verify access tokens. Reads the
 * public URL + anon key; never persists a session.
 */
function authClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY must be set to verify auth tokens.",
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

/**
 * Resolve a Supabase access token to a user id, or null if the token is
 * missing/invalid. This is the single trust boundary: the returned id is what
 * scopedDb() locks every query to.
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  const { data, error } = await authClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
