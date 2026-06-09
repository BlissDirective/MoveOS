import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAuthUrl, nylasConfigured } from "@/lib/nylas/auth";

/** Start the Nylas hosted-auth flow: set a CSRF state cookie, redirect to Nylas. */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }
  if (!nylasConfigured()) {
    return NextResponse.redirect(new URL("/dashboard?nylas=unconfigured", req.url));
  }

  const redirectUri = new URL("/api/nylas/callback", req.url).toString();
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(buildAuthUrl(redirectUri, state));
  res.cookies.set("nylas_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
