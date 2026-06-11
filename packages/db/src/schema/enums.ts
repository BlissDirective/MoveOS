import { pgEnum } from "drizzle-orm/pg-core";

// Enums mirror the CHECK constraints in spec §9.

export const moveStatus = pgEnum("move_status", [
  "planning",
  "active",
  "moving_day",
  "settling",
  "completed",
  "cancelled",
]);

export const homeSize = pgEnum("home_size", [
  "studio",
  "1br",
  "2br",
  "3br",
  "4br_plus",
]);

export const moveType = pgEnum("move_type", [
  "local",
  "long_distance",
  "interstate",
]);

export const planTier = pgEnum("plan_tier", [
  "free",
  "essentials",
  "complete",
  "premium",
]);

export const taskPriority = pgEnum("task_priority", [
  "critical",
  "high",
  "medium",
  "low",
]);

export const taskStatus = pgEnum("task_status", [
  "pending",
  "agent_working",
  "awaiting_approval",
  "completed",
  "skipped",
  "overdue",
]);

// Includes timeline + reply_parse agents added in the review (spec §6.5, §10.0).
export const agentType = pgEnum("agent_type", [
  "setup",
  "quote",
  "internet",
  "utility",
  "address",
  "service",
  "timeline",
  "moving_day",
  "settled",
  "reply_parse",
  "manual",
]);

export const agentTaskStatus = pgEnum("agent_task_status", [
  "queued",
  "running",
  "awaiting_approval",
  "completed",
  "failed",
  "cancelled",
]);

export const approvalStatus = pgEnum("approval_status", [
  "awaiting_approval",
  "approved",
  "rejected",
  "edited_approved",
  "skipped",
]);

export const approvalPriority = pgEnum("approval_priority", [
  "high",
  "medium",
  "low",
]);

// Referral-first monetization (review §7.3): unregulated categories only.
// Mover-side referral fees are FMCSA-gated and deliberately NOT a category.
export const affiliateCategory = pgEnum("affiliate_category", [
  "isp",
  "utility",
  "insurance",
  "storage",
  "home_service",
]);
