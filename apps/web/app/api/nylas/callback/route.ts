import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, userProfiles } from "@moveros/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exchangeCodeForGrant } from "@/lib/nylas/auth";

/** Nylas redirects here with ?code. Exchange it and store the grant on the profile. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = req.cookies.get("nylas_state")?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/dashboard?nylas=${reason}`, req.url));

  if (!code || !state || state !== expectedState) return fail("error");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/sign-in", req.url));

  try {
    const redirectUri = new URL("/api/nylas/callback", req.url).toString();
    const grant = await exchangeCodeForGrant(code, redirectUri);
    await getDb()
      .update(userProfiles)
      .set({ nylasGrantId: grant.grantId, nylasEmail: grant.email, updatedAt: new Date() })
      .where(eq(userProfiles.id, user.id));
  } catch {
    return fail("error");
  }

  const res = NextResponse.redirect(new URL("/dashboard?nylas=connected", req.url));
  res.cookies.delete("nylas_state");
  return res;
}
