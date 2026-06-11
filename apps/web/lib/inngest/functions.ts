import Anthropic from "@anthropic-ai/sdk";
import { and, eq, isNull } from "drizzle-orm";
import {
  getDb,
  agentTasks,
  approvalItems,
  moves,
  tasks,
  userProfiles,
  type Database,
  type Move,
} from "@moveros/db";
import { sendEmail } from "../nylas/send";
import { AFFILIATE_OFFERS, offersByCategory } from "../affiliate/offers";
import {
  inngest,
  replyParseAgent,
  runAgent,
  timelineAgent,
  quoteAgent,
  internetAgent,
  type ReplyParseInput,
  type TimelineInput,
  type TimelineTask,
  type QuoteInput,
  type InternetInput,
  type InternetRecommendation,
} from "@moveros/agents";

/**
 * Ownership assertion for event-driven code paths. Inngest functions run on
 * the unscoped service-role client, and (since the Nylas webhook) not every
 * event producer is an ownership-checked tRPC mutation — so every function
 * re-verifies that the event's moveId belongs to the event's userId before
 * reading or writing anything.
 */
async function requireMoveOwned(
  db: Database,
  moveId: string,
  userId: string,
): Promise<Move> {
  const [row] = await db
    .select()
    .from(moves)
    .where(and(eq(moves.id, moveId), eq(moves.userId, userId)))
    .limit(1);
  if (!row) throw new Error(`move ${moveId} not owned by event user`);
  return row;
}

type TimelineOutcome = {
  ok: boolean;
  tasks: TimelineTask[];
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  error: string | null;
};

/** Whole days from today (UTC) until an ISO date; can be negative. */
function daysUntil(isoDate: string): number {
  const target = Date.parse(`${isoDate}T00:00:00Z`);
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}

/** moveDate minus N days, as YYYY-MM-DD (null passes through). */
function dueDateFrom(moveDate: string, daysBefore: number | null): string | null {
  if (daysBefore === null) return null;
  const d = new Date(`${moveDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - daysBefore);
  return d.toISOString().slice(0, 10);
}

/**
 * parse-email-reply — the first agent loop end to end.
 *
 * On an inbound vendor reply: record an agent_tasks row, run the reply_parse
 * agent through the harness, then write the cost ledger back and drop the
 * structured result into the approval queue for the user to act on. Each
 * `step.run` is independently retried/memoized by Inngest.
 */
export const parseEmailReply = inngest.createFunction(
  { id: "parse-email-reply", retries: 2 },
  { event: "email/reply.received" },
  async ({ event, step }) => {
    const { moveId, userId, threadId, subject, from, body } = event.data;
    const db = getDb();

    const agentTaskId = await step.run("create-agent-task", async () => {
      await requireMoveOwned(db, moveId, userId);
      const [row] = await db
        .insert(agentTasks)
        .values({
          moveId,
          agentType: "reply_parse",
          status: "running",
          startedAt: new Date(),
          inputData: { threadId, from },
        })
        .returning({ id: agentTasks.id });
      if (!row) throw new Error("failed to create agent_tasks row");
      return row.id;
    });

    const outcome = await step.run("run-reply-parse", async () => {
      const client = new Anthropic();
      const input: ReplyParseInput = {
        // Today every thread MoverOS initiates is mover outreach; revisit when
        // other vendor outreach lands (derive from the matched approval item).
        vendorType: "mover",
        subject: subject || "(email reply)",
        body: body.slice(0, 20_000),
      };
      const result = await runAgent(replyParseAgent, input, { client });
      return result.ok
        ? {
            ok: true,
            output: result.output,
            model: replyParseAgent.model,
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            costUsd: result.costUsd,
            error: null,
          }
        : {
            ok: false,
            output: null,
            model: replyParseAgent.model,
            inputTokens: 0,
            outputTokens: 0,
            costUsd: 0,
            error: result.error,
          };
    });

    await step.run("record-result", async () => {
      if (outcome.ok && outcome.output) {
        await db
          .update(agentTasks)
          .set({
            status: "awaiting_approval",
            completedAt: new Date(),
            outputData: outcome.output,
            llmModel: outcome.model,
            inputTokens: outcome.inputTokens,
            outputTokens: outcome.outputTokens,
            estimatedCostUsd: outcome.costUsd.toFixed(6),
          })
          .where(eq(agentTasks.id, agentTaskId));

        await db.insert(approvalItems).values({
          moveId,
          agentTaskId,
          agentType: "reply_parse",
          title: from ? `Reply from ${from}` : "Vendor reply parsed",
          body: outcome.output.summary,
          outputData: { ...outcome.output, threadId, from },
          emailThreadId: threadId,
          priority: "medium",
        });
      } else {
        await db
          .update(agentTasks)
          .set({
            status: "failed",
            failedAt: new Date(),
            errorMessage: outcome.error,
          })
          .where(eq(agentTasks.id, agentTaskId));
      }
    });

    return { agentTaskId, ok: outcome.ok };
  },
);

/**
 * generate-timeline — the second agent loop. On move creation, run the timeline
 * agent (Opus) to produce a personalized checklist, then persist the tasks and
 * flip the move to active. Steps are retried/memoized independently by Inngest.
 */
export const generateTimeline = inngest.createFunction(
  { id: "generate-timeline", retries: 2 },
  { event: "move/created" },
  async ({ event, step }) => {
    const { moveId, userId } = event.data;
    const db = getDb();

    const move = await step.run("load-move", () =>
      requireMoveOwned(db, moveId, userId),
    );

    const agentTaskId = await step.run("create-agent-task", async () => {
      const [row] = await db
        .insert(agentTasks)
        .values({
          moveId,
          agentType: "timeline",
          status: "running",
          startedAt: new Date(),
        })
        .returning({ id: agentTasks.id });
      if (!row) throw new Error("failed to create agent_tasks row");
      return row.id;
    });

    const outcome = await step.run("run-timeline", async (): Promise<TimelineOutcome> => {
      const client = new Anthropic();
      const input: TimelineInput = {
        originCity: move.originCity ?? "",
        originState: move.originState ?? "",
        destinationCity: move.destinationCity ?? "",
        destinationState: move.destinationState ?? "",
        moveDate: move.moveDate,
        daysUntilMove: daysUntil(move.moveDate),
        homeSize: move.homeSize,
        moveType: move.moveType ?? null,
        specialItems: move.specialItems ?? [],
      };
      const result = await runAgent(timelineAgent, input, { client });
      return result.ok
        ? {
            ok: true,
            tasks: result.output.tasks,
            model: timelineAgent.model,
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            costUsd: result.costUsd,
            error: null,
          }
        : {
            ok: false,
            tasks: [],
            model: timelineAgent.model,
            inputTokens: 0,
            outputTokens: 0,
            costUsd: 0,
            error: result.error,
          };
    });

    await step.run("persist", async () => {
      if (!outcome.ok) {
        await db
          .update(agentTasks)
          .set({ status: "failed", failedAt: new Date(), errorMessage: outcome.error })
          .where(eq(agentTasks.id, agentTaskId));
        return;
      }

      if (outcome.tasks.length > 0) {
        await db.insert(tasks).values(
          outcome.tasks.map((t, i) => ({
            moveId,
            agentType: t.agentType,
            category: t.category,
            title: t.title,
            description: t.description,
            dueDate: dueDateFrom(move.moveDate, t.dueDaysBefore),
            dueDaysBefore: t.dueDaysBefore,
            priority: t.priority,
            sortOrder: i,
          })),
        );
      }

      await db
        .update(agentTasks)
        .set({
          status: "completed",
          completedAt: new Date(),
          outputData: { taskCount: outcome.tasks.length },
          llmModel: outcome.model,
          inputTokens: outcome.inputTokens,
          outputTokens: outcome.outputTokens,
          estimatedCostUsd: outcome.costUsd.toFixed(6),
        })
        .where(eq(agentTasks.id, agentTaskId));

      await db
        .update(moves)
        .set({ status: "active", taskCount: outcome.tasks.length })
        .where(eq(moves.id, moveId));
    });

    return { agentTaskId, taskCount: outcome.tasks.length, ok: outcome.ok };
  },
);

/**
 * dispatch-approved-action — performs the gated action behind an approval once
 * the user approves it. For email-send items, resolves the user's Nylas grant
 * and sends, then records the send. No-ops for items that aren't email sends or
 * were already sent. (Sends are simulated until Nylas is configured.)
 */
export const dispatchApprovedAction = inngest.createFunction(
  { id: "dispatch-approved-action", retries: 2 },
  { event: "approval/approved" },
  async ({ event, step }) => {
    const { approvalId, moveId, userId } = event.data;
    const db = getDb();

    const approval = await step.run("load-approval", async () => {
      await requireMoveOwned(db, moveId, userId);
      const [row] = await db
        .select()
        .from(approvalItems)
        .where(and(eq(approvalItems.id, approvalId), eq(approvalItems.moveId, moveId)))
        .limit(1);
      if (!row) throw new Error(`approval ${approvalId} not found`);
      return row;
    });

    // Only user-approved items act in the world — never a still-pending or
    // rejected one, no matter what the event says.
    if (approval.status !== "approved" && approval.status !== "edited_approved") {
      return { sent: false, reason: `status is ${approval.status}` };
    }
    if (!approval.requiresEmailSend || approval.emailSentAt || !approval.emailTo) {
      return { sent: false, reason: "no email to send" };
    }

    // Atomically claim the send (emailSentAt doubles as the claim flag) so a
    // double-fired event can't double-send: at-most-once for the side effect.
    const claimed = await step.run("claim-send", async () => {
      const [row] = await db
        .update(approvalItems)
        .set({ emailSentAt: new Date(), updatedAt: new Date() })
        .where(and(eq(approvalItems.id, approvalId), isNull(approvalItems.emailSentAt)))
        .returning({ id: approvalItems.id });
      return Boolean(row);
    });
    if (!claimed) {
      return { sent: false, reason: "already claimed/sent" };
    }

    const sent = await step.run("send-email", async () => {
      const [profile] = await db
        .select({ grantId: userProfiles.nylasGrantId })
        .from(userProfiles)
        .where(eq(userProfiles.id, userId))
        .limit(1);
      return sendEmail({
        grantId: profile?.grantId ?? null,
        to: approval.emailTo ?? "",
        subject: approval.emailSubject ?? "",
        body: approval.emailBody ?? "",
      });
    });

    await step.run("record-thread", async () => {
      await db
        .update(approvalItems)
        .set({ emailThreadId: sent.threadId, updatedAt: new Date() })
        .where(eq(approvalItems.id, approvalId));
    });

    return { sent: true, simulated: sent.simulated, threadId: sent.threadId };
  },
);

type InternetOutcome = {
  ok: boolean;
  summary: string;
  recommendations: InternetRecommendation[];
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  error: string | null;
};

/**
 * recommend-internet — the first referral-bearing agent loop (review §7.3:
 * monetize ISP/utility/insurance referrals first; mover-side fees are
 * FMCSA-gated). Ranks the ISP candidates from the offers catalog for this
 * move's destination and drops the picks into the approval inbox; the
 * affiliate click only happens if the user follows a link from the card.
 *
 * Candidates come from the static catalog today — swap in the SmartyStreets
 * address-level availability lookup when that integration lands.
 */
export const recommendInternet = inngest.createFunction(
  { id: "recommend-internet", retries: 2 },
  { event: "internet/requested" },
  async ({ event, step }) => {
    const { moveId, userId } = event.data;
    const db = getDb();

    const move = await step.run("load-move", () =>
      requireMoveOwned(db, moveId, userId),
    );

    const agentTaskId = await step.run("create-agent-task", async () => {
      const [row] = await db
        .insert(agentTasks)
        .values({ moveId, agentType: "internet", status: "running", startedAt: new Date() })
        .returning({ id: agentTasks.id });
      if (!row) throw new Error("failed to create agent_tasks row");
      return row.id;
    });

    const outcome = await step.run("run-internet", async (): Promise<InternetOutcome> => {
      const client = new Anthropic();
      const candidates = offersByCategory("isp")
        .filter((o) => o.isp)
        .map((o) => ({
          offerId: o.id,
          provider: o.provider,
          technology: o.isp!.technology,
          typicalDownloadMbps: o.isp!.typicalDownloadMbps,
          typicalMonthlyUsd: o.isp!.typicalMonthlyUsd,
          notes: o.isp!.notes,
        }));
      const input: InternetInput = {
        destinationCity: move.destinationCity ?? "",
        destinationState: move.destinationState ?? "",
        destinationZip: move.destinationZip ?? null,
        homeSize: move.homeSize,
        candidates,
      };
      const result = await runAgent(internetAgent, input, { client });
      if (!result.ok) {
        return {
          ok: false,
          summary: "",
          recommendations: [],
          model: internetAgent.model,
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          error: result.error,
        };
      }
      // No-fabrication gate: only recommendations whose offerId exists in the
      // catalog survive (the agent can't invent a provider we'd then link to).
      const recommendations = result.output.recommendations.filter(
        (r) => AFFILIATE_OFFERS[r.offerId]?.category === "isp",
      );
      return recommendations.length > 0
        ? {
            ok: true,
            summary: result.output.summary,
            recommendations,
            model: internetAgent.model,
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            costUsd: result.costUsd,
            error: null,
          }
        : {
            ok: false,
            summary: "",
            recommendations: [],
            model: internetAgent.model,
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            costUsd: result.costUsd,
            error: "all recommendations referenced unknown offers",
          };
    });

    await step.run("persist", async () => {
      if (!outcome.ok) {
        await db
          .update(agentTasks)
          .set({ status: "failed", failedAt: new Date(), errorMessage: outcome.error })
          .where(eq(agentTasks.id, agentTaskId));
        return;
      }

      const topPick = outcome.recommendations[0]!;
      await db.insert(approvalItems).values({
        moveId,
        agentTaskId,
        agentType: "internet",
        status: "awaiting_approval",
        priority: "medium",
        title: "Internet options at your new place",
        body: outcome.summary,
        outputData: { recommendations: outcome.recommendations },
        affiliateType: "isp",
        affiliatePickId: topPick.offerId,
      });

      await db
        .update(agentTasks)
        .set({
          status: "awaiting_approval",
          completedAt: new Date(),
          outputData: { recommendations: outcome.recommendations },
          llmModel: outcome.model,
          inputTokens: outcome.inputTokens,
          outputTokens: outcome.outputTokens,
          estimatedCostUsd: outcome.costUsd.toFixed(6),
        })
        .where(eq(agentTasks.id, agentTaskId));
    });

    return { agentTaskId, ok: outcome.ok };
  },
);

type QuoteOutcome = {
  ok: boolean;
  summary: string;
  emailSubject: string;
  emailBody: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  error: string | null;
};

/**
 * request-quotes — runs the quote agent to draft vendor outreach, then drops the
 * draft into the approval queue (requiresEmailSend, awaiting recipient + approval).
 * This is what fills the inbox from a real agent run.
 */
export const requestQuotes = inngest.createFunction(
  { id: "request-quotes", retries: 2 },
  { event: "quote/requested" },
  async ({ event, step }) => {
    const { moveId, userId } = event.data;
    const db = getDb();

    const move = await step.run("load-move", () =>
      requireMoveOwned(db, moveId, userId),
    );

    const agentTaskId = await step.run("create-agent-task", async () => {
      const [row] = await db
        .insert(agentTasks)
        .values({ moveId, agentType: "quote", status: "running", startedAt: new Date() })
        .returning({ id: agentTasks.id });
      if (!row) throw new Error("failed to create agent_tasks row");
      return row.id;
    });

    const outcome = await step.run("run-quote", async (): Promise<QuoteOutcome> => {
      const client = new Anthropic();
      const input: QuoteInput = {
        originCity: move.originCity ?? "",
        originState: move.originState ?? "",
        destinationCity: move.destinationCity ?? "",
        destinationState: move.destinationState ?? "",
        moveDate: move.moveDate,
        homeSize: move.homeSize,
        moveType: move.moveType ?? null,
        specialItems: move.specialItems ?? [],
      };
      const result = await runAgent(quoteAgent, input, { client });
      return result.ok
        ? {
            ok: true,
            summary: result.output.summary,
            emailSubject: result.output.emailSubject,
            emailBody: result.output.emailBody,
            model: quoteAgent.model,
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            costUsd: result.costUsd,
            error: null,
          }
        : {
            ok: false,
            summary: "",
            emailSubject: "",
            emailBody: "",
            model: quoteAgent.model,
            inputTokens: 0,
            outputTokens: 0,
            costUsd: 0,
            error: result.error,
          };
    });

    await step.run("persist", async () => {
      if (!outcome.ok) {
        await db
          .update(agentTasks)
          .set({ status: "failed", failedAt: new Date(), errorMessage: outcome.error })
          .where(eq(agentTasks.id, agentTaskId));
        return;
      }

      await db.insert(approvalItems).values({
        moveId,
        agentTaskId,
        agentType: "quote",
        status: "awaiting_approval",
        priority: "high",
        title: "Send a quote request to a mover",
        body: outcome.summary,
        requiresEmailSend: true,
        emailTo: "", // user sets the recipient in the inbox before approving
        emailSubject: outcome.emailSubject,
        emailBody: outcome.emailBody,
        outputData: { summary: outcome.summary },
      });

      await db
        .update(agentTasks)
        .set({
          status: "awaiting_approval",
          completedAt: new Date(),
          outputData: { summary: outcome.summary },
          llmModel: outcome.model,
          inputTokens: outcome.inputTokens,
          outputTokens: outcome.outputTokens,
          estimatedCostUsd: outcome.costUsd.toFixed(6),
        })
        .where(eq(agentTasks.id, agentTaskId));
    });

    return { agentTaskId, ok: outcome.ok };
  },
);
