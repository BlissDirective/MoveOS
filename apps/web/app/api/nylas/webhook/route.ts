import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { getDb, approvalItems, moves, userProfiles } from "@moveros/db";
import { inngest } from "@moveros/agents";

/**
 * /api/nylas/webhook — inbound mail, the producer for `email/reply.received`.
 *
 * Security model (review §5.1): the webhook is the first event producer that
 * is NOT an ownership-checked tRPC mutation, so nothing in the payload is
 * trusted on its own:
 *   1. The request must carry a valid HMAC-SHA256 `x-nylas-signature` over the
 *      raw body, keyed with NYLAS_WEBHOOK_SECRET.
 *   2. moveId/userId are NEVER taken from email content — they are resolved
 *      server-side: thread id → approval_items row we sent on, then that
 *      row's move, then cross-checked against the grant's profile owner.
 *   3. Anything that doesn't resolve is acknowledged (200) and dropped —
 *      unrelated inbox traffic is expected, not an error.
 */

const MAX_AGENT_BODY_CHARS = 20_000;

/** Nylas verifies the callback URL by echoing a challenge query param. */
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("challenge");
  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ ok: true });
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.NYLAS_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Crude HTML → text for the agent: strip tags/styles, collapse whitespace. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface NylasMessageWebhook {
  type?: string;
  data?: {
    object?: {
      grant_id?: string;
      thread_id?: string;
      subject?: string;
      body?: string;
      snippet?: string;
      from?: Array<{ email?: string; name?: string }>;
    };
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get("x-nylas-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: NylasMessageWebhook;
  try {
    payload = JSON.parse(rawBody) as NylasMessageWebhook;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Only inbound message events matter here; ack everything else.
  if (payload.type !== "message.created") {
    return NextResponse.json({ ok: true, skipped: payload.type ?? "unknown" });
  }

  const msg = payload.data?.object;
  const grantId = msg?.grant_id;
  const threadId = msg?.thread_id;
  if (!grantId || !threadId) {
    return NextResponse.json({ ok: true, skipped: "no grant/thread" });
  }

  const db = getDb();

  // Resolve the thread to an outreach we actually sent, and its owning move.
  const [match] = await db
    .select({
      moveId: approvalItems.moveId,
      ownerId: moves.userId,
    })
    .from(approvalItems)
    .innerJoin(moves, eq(approvalItems.moveId, moves.id))
    .where(
      and(
        eq(approvalItems.emailThreadId, threadId),
        isNotNull(approvalItems.emailSentAt),
      ),
    )
    .limit(1);
  if (!match) {
    // Not a thread MoverOS started — normal inbox noise, drop silently.
    return NextResponse.json({ ok: true, skipped: "unknown thread" });
  }

  // Cross-check: the grant this message arrived on must belong to the same
  // user who owns the move (a reply can't be routed into someone else's move).
  const [profile] = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.nylasGrantId, grantId))
    .limit(1);
  if (!profile || profile.id !== match.ownerId) {
    console.warn(`[nylas-webhook] grant/move owner mismatch on thread ${threadId}`);
    return NextResponse.json({ ok: true, skipped: "owner mismatch" });
  }

  // Skip the user's own outbound messages on the thread.
  const fromEmail = msg?.from?.[0]?.email ?? "";
  const [self] = await db
    .select({ email: userProfiles.nylasEmail })
    .from(userProfiles)
    .where(eq(userProfiles.id, profile.id))
    .limit(1);
  if (self?.email && fromEmail.toLowerCase() === self.email.toLowerCase()) {
    return NextResponse.json({ ok: true, skipped: "own message" });
  }

  const text = htmlToText(msg?.body ?? msg?.snippet ?? "").slice(
    0,
    MAX_AGENT_BODY_CHARS,
  );
  if (!text) {
    return NextResponse.json({ ok: true, skipped: "empty body" });
  }

  await inngest.send({
    name: "email/reply.received",
    data: {
      moveId: match.moveId,
      userId: match.ownerId,
      threadId,
      subject: (msg?.subject ?? "(no subject)").slice(0, 500),
      from: fromEmail,
      body: text,
    },
  });

  return NextResponse.json({ ok: true });
}
