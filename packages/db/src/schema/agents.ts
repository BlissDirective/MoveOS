import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { agentType, agentTaskStatus } from "./enums";

/**
 * agent_tasks — one row per agent invocation. Records the Inngest run, the
 * input/output payloads, and per-run token usage + estimated cost (the cost
 * ledger the harness writes through onCost).
 */
export const agentTasks = pgTable(
  "agent_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moveId: uuid("move_id")
      .notNull()
      .references(() => moves.id, { onDelete: "cascade" }),

    agentType: agentType("agent_type").notNull(),

    // Inngest correlation.
    inngestEventId: text("inngest_event_id"),
    inngestRunId: text("inngest_run_id"),

    status: agentTaskStatus("status").default("queued").notNull(),

    inputData: jsonb("input_data")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    outputData: jsonb("output_data")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0).notNull(),

    queuedAt: timestamp("queued_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),

    // Cost ledger.
    llmModel: text("llm_model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    estimatedCostUsd: numeric("estimated_cost_usd", { precision: 10, scale: 6 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_agent_tasks_move_id").on(t.moveId),
    index("idx_agent_tasks_status").on(t.status),
    index("idx_agent_tasks_run_id").on(t.inngestRunId),
  ],
);

export type AgentTask = typeof agentTasks.$inferSelect;
export type NewAgentTask = typeof agentTasks.$inferInsert;
