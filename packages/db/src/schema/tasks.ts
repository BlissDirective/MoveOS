import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { agentType, taskPriority, taskStatus } from "./enums";

/**
 * tasks — the user-facing checklist items on a move's timeline. Each task is
 * owned by exactly one move (scope tasks through moves.userId, never directly).
 */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moveId: uuid("move_id")
      .notNull()
      .references(() => moves.id, { onDelete: "cascade" }),

    agentType: agentType("agent_type").notNull(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    // Instructions handed to the agent when this task is actioned.
    instructions: text("instructions"),

    dueDate: date("due_date"),
    dueDaysBefore: integer("due_days_before"),

    priority: taskPriority("priority").default("medium").notNull(),
    status: taskStatus("status").default("pending").notNull(),

    // Soft dependency edges (task ids that should complete first).
    dependsOn: uuid("depends_on").array().default([]).notNull(),

    completionNotes: text("completion_notes"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    skippedAt: timestamp("skipped_at", { withTimezone: true }),
    skippedReason: text("skipped_reason"),

    // Last agent run that actioned this task (no FK: agent_tasks may be pruned).
    agentTaskId: uuid("agent_task_id"),

    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_tasks_move_id").on(t.moveId),
    index("idx_tasks_status").on(t.status),
    index("idx_tasks_due_date").on(t.dueDate),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
