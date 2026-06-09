const API_BASE = process.env.NYLAS_API_URI ?? "https://api.us.nylas.com";

/** True when the hosted-auth credentials are present. */
export function nylasConfigured(): boolean {
  return Boolean(process.env.NYLAS_CLIENT_ID && process.env.NYLAS_API_KEY);
}

/** Build the Nylas v3 hosted-auth URL to redirect the user to. */
export function buildAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.NYLAS_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "online",
    state,
  });
  return `${API_BASE}/v3/connect/auth?${params.toString()}`;
}

export interface NylasGrant {
  grantId: string;
  email: string;
}

/** Exchange the auth code for a grant (the long-lived connection to the inbox). */
export async function exchangeCodeForGrant(
  code: string,
  redirectUri: string,
): Promise<NylasGrant> {
  const res = await fetch(`${API_BASE}/v3/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.NYLAS_CLIENT_ID,
      client_secret: process.env.NYLAS_API_KEY,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`Nylas token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { grant_id?: string; email?: string };
  if (!json.grant_id) throw new Error("Nylas token exchange returned no grant_id");
  return { grantId: json.grant_id, email: json.email ?? "" };
}
