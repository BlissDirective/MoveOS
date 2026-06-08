import {
  pgTable,
  uuid,
  text,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { agentTasks } from "./agents";
import { agentType, approvalStatus, approvalPriority } from "./enums";

/**
 * approval_items — the human-in-the-loop queue. Every agent action that sends
 * email, spends money, or shares an affiliate link lands here for explicit
 * user approval before MoverOS acts (spec §6.5 — approval gate).
 */
export const approvalItems = pgTable(
  "approval_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moveId: uuid("move_id")
      .notNull()
      .references(() => moves.id, { onDelete: "cascade" }),
    agentTaskId: uuid("agent_task_id").references(() => agentTasks.id, {
      onDelete: "set null",
    }),

    agentType: agentType("agent_type").notNull(),
    status: approvalStatus("status").default("awaiting_approval").notNull(),
    priority: approvalPriority("priority").default("medium").notNull(),

    title: text("title").notNull(),
    body: text("body").notNull(),
    outputData: jsonb("output_data")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    // Email-send actions (drafted, sent only after approval via Nylas).
    requiresEmailSend: boolean("requires_email_send").default(false).notNull(),
    emailTo: text("email_to"),
    emailSubject: text("email_subject"),
    emailBody: text("email_body"),
    emailThreadId: text("email_thread_id"),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),

    // Affiliate / partner recommendations.
    affiliateType: text("affiliate_type"),
    affiliatePickId: text("affiliate_pick_id"),
    affiliateLink: text("affiliate_link"),
    affiliateClicked: boolean("affiliate_clicked").default(false).notNull(),

    // User decision trail.
    userEdits: jsonb("user_edits").$type<Record<string, unknown>>(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_approval_items_move_id").on(t.moveId),
    index("idx_approval_items_status").on(t.status),
    index("idx_approval_items_agent_task_id").on(t.agentTaskId),
  ],
);

export type ApprovalItem = typeof approvalItems.$inferSelect;
export type NewApprovalItem = typeof approvalItems.$inferInsert;
