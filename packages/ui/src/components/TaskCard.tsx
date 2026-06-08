"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/cn";
import { spring } from "../theme/motion";
import { Button } from "./Button";
import { PriorityChip } from "./PriorityChip";
import type { AgentType, TaskPriority, TaskStatus } from "./types";

/**
 * TaskCard — the most-used surface (docs/design.md §4 — Cards). Elevation
 * encodes status: actionable cards float (e2) and lift on hover; completed and
 * skipped cards sink (e0). Tinted backgrounds + accents carry domain meaning.
 */
export interface TaskCardProps {
  title: string;
  description?: string;
  agentType: AgentType;
  /** Human label for the agent, e.g. "QuoteAgent". Defaults to agentType. */
  agentLabel?: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** e.g. "Due in 3 days" or "Overdue by 2 days". */
  dueLabel?: string;
  onReview?: () => void;
  onSkip?: () => void;
  className?: string;
}

const container: Record<TaskStatus, string> = {
  pending: "bg-surface-card border-surface-border shadow-e1 opacity-90",
  agent_working: "bg-surface-card border-info/30 shadow-e2",
  awaiting_approval: "bg-accent-100 border-accent-300 shadow-e2",
  completed: "bg-brand-50 border-brand-200 shadow-e0",
  skipped: "bg-surface-card border-surface-border shadow-e0 opacity-60",
  overdue: "bg-surface-card border-error shadow-e2",
};

const struck = (status: TaskStatus) =>
  status === "completed" || status === "skipped";

export function TaskCard({
  title,
  description,
  agentType,
  agentLabel,
  priority,
  status,
  dueLabel,
  onReview,
  onSkip,
  className,
}: TaskCardProps) {
  const reduce = useReducedMotion();
  const interactive = status === "awaiting_approval" || status === "overdue";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: status === "skipped" ? 0.6 : 1, y: 0 }}
      whileHover={interactive && !reduce ? { y: -2 } : undefined}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border p-5",
        status === "agent_working" &&
          "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-lg before:bg-info",
        container[status],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <StatusIndicator status={status} reduce={reduce} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className={cn(
                "text-[16px] font-semibold text-neutral-900",
                struck(status) && "text-neutral-500 line-through",
              )}
            >
              {title}
            </h3>
            <PriorityChip priority={priority} />
          </div>
          {description ? (
            <p className="mt-1 text-[13px] leading-5 text-neutral-600">
              {description}
            </p>
          ) : null}
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-neutral-500">
            <span>{agentLabel ?? agentType}</span>
            {dueLabel ? (
              <>
                <span aria-hidden className="text-neutral-300">
                  ·
                </span>
                <span className={cn(status === "overdue" && "text-error")}>
                  {dueLabel}
                </span>
              </>
            ) : null}
            {status === "agent_working" ? (
              <>
                <span aria-hidden className="text-neutral-300">
                  ·
                </span>
                <span className="text-info">Agent working…</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {interactive && (onReview || onSkip) ? (
        <div className="flex items-center gap-2 pl-9">
          {onReview ? (
            <Button size="sm" onClick={onReview}>
              Review &amp; Approve
            </Button>
          ) : null}
          {onSkip ? (
            <Button size="sm" variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}

function StatusIndicator({
  status,
  reduce,
}: {
  status: TaskStatus;
  reduce: boolean | null;
}) {
  if (status === "completed") {
    return (
      <motion.span
        initial={reduce ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={spring.celebration}
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white"
        aria-label="Completed"
      >
        <CheckIcon />
      </motion.span>
    );
  }
  if (status === "agent_working") {
    return (
      <span
        className="mt-1 h-3 w-3 shrink-0 animate-pulse rounded-full bg-info ring-4 ring-info/15"
        aria-label="Agent working"
      />
    );
  }
  const dot =
    status === "awaiting_approval"
      ? "border-accent-500"
      : status === "overdue"
        ? "border-error"
        : "border-neutral-300";
  return (
    <span
      className={cn(
        "mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 bg-transparent",
        dot,
      )}
      aria-hidden
    />
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
