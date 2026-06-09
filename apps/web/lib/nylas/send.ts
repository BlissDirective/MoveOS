export interface SendEmailArgs {
  /** The user's Nylas grant (user_profiles.nylas_grant_id), or null. */
  grantId: string | null;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string | null;
  threadId: string | null;
  /** True when no real send happened (Nylas not configured / no grant). */
  simulated: boolean;
}

/**
 * Send an email on the user's behalf via Nylas v3. When Nylas isn't configured
 * or the user hasn't connected an inbox, we SIMULATE the send so the
 * human-in-the-loop still completes in dev — the real send lands once
 * NYLAS_API_KEY + a grant exist.
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.NYLAS_API_KEY;
  const apiBase = process.env.NYLAS_API_URI ?? "https://api.us.nylas.com";

  if (!apiKey || !args.grantId) {
    console.warn(`[nylas] not configured — simulating send to ${args.to}`);
    return { messageId: null, threadId: null, simulated: true };
  }

  const res = await fetch(
    `${apiBase}/v3/grants/${args.grantId}/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [{ email: args.to }],
        subject: args.subject,
        body: args.body,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Nylas send failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    data?: { id?: string; thread_id?: string };
  };
  return {
    messageId: json.data?.id ?? null,
    threadId: json.data?.thread_id ?? null,
    simulated: false,
  };
}
