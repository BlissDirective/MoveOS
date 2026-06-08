// Display-layer unions. Mirror the @moveros/db enums but live here so the UI
// package stays dependency-free (and usable from mobile later).

export type TaskStatus =
  | "pending"
  | "agent_working"
  | "awaiting_approval"
  | "completed"
  | "skipped"
  | "overdue";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type AgentTaskStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentType =
  | "setup"
  | "quote"
  | "internet"
  | "utility"
  | "address"
  | "service"
  | "timeline"
  | "moving_day"
  | "settled"
  | "reply_parse"
  | "manual";
