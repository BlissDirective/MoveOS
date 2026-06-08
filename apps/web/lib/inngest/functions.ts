import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { getDb, agentTasks, approvalItems } from "@moveros/db";
import {
  inngest,
  replyParseAgent,
  runAgent,
  type ReplyParseInput,
} from "@moveros/agents";

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
