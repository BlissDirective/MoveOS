import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { getDb, agentTasks, approvalItems, moves, tasks } from "@moveros/db";
import {
  inngest,
  replyParseAgent,
  runAgent,
  timelineAgent,
  type ReplyParseInput,
  type TimelineInput,
  type TimelineTask,
} from "@moveros/agents";

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
    const { moveId, threadId, body } = event.data;
    const db = getDb();

    const agentTaskId = await step.run("create-agent-task", async () => {
      const [row] = await db
        .insert(agentTasks)
        .values({
          moveId,
          agentType: "reply_parse",
          status: "running",
          startedAt: new Date(),
          inputData: { threadId },
        })
        .returning({ id: agentTasks.id });
      if (!row) throw new Error("failed to create agent_tasks row");
      return row.id;
    });

    const outcome = await step.run("run-reply-parse", async () => {
      const client = new Anthropic();
      const input: ReplyParseInput = {
        vendorType: "other",
        subject: "(email reply)",
        body,
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
          title: "Vendor reply parsed",
          body: outcome.output.summary,
          outputData: outcome.output,
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
    const { moveId } = event.data;
    const db = getDb();

    const move = await step.run("load-move", async () => {
      const [row] = await db.select().from(moves).where(eq(moves.id, moveId)).limit(1);
      if (!row) throw new Error(`move ${moveId} not found`);
      return row;
    });

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
