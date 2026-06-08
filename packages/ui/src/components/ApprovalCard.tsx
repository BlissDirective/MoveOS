"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/cn";
import { Button } from "./Button";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { PriorityChip } from "./PriorityChip";
import type { AgentType, TaskPriority } from "./types";

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

/**
 * ApprovalCard — an item in the human-in-the-loop queue (spec §6.5). Amber,
 * raised (e2), and never auto-acts: every send/spend waits behind Approve.
 */
export interface ApprovalCardProps {
  title: string;
  body: string;
  agentType: AgentType;
  agentLabel?: string;
  priority: TaskPriority;
  /** When present, renders the drafted email that will be sent on approval. */
  emailDraft?: EmailDraft;
  onApprove?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
  className?: string;
}

export function ApprovalCard({
  title,
  body,
  agentType,
  agentLabel,
  priority,
  emailDraft,
  onApprove,
  onEdit,
  onReject,
  className,
}: ApprovalCardProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-accent-200 bg-surface-card p-5 shadow-e2",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AgentStatusBadge
            status="awaiting_approval"
            label={agentLabel ?? agentType}
          />
          <PriorityChip priority={priority} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-[18px] font-semibold tracking-[-0.2px] text-neutral-900">
          {title}
        </h3>
        <p className="text-[15px] leading-6 text-neutral-700">{body}</p>
      </div>

      {emailDraft ? (
        <figure className="rounded-md bg-surface-sunken p-4 shadow-[var(--shadow-inset)]">
          <figcaption className="mb-2 font-mono text-[11px] uppercase tracking-wide text-neutral-500">
            Draft email
          </figcaption>
          <dl className="space-y-1 text-[13px] text-neutral-700">
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-neutral-500">To</dt>
              <dd className="truncate">{emailDraft.to}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-neutral-500">Subject</dt>
              <dd className="truncate">{emailDraft.subject}</dd>
            </div>
          </dl>
          <p className="mt-2 line-clamp-3 whitespace-pre-line text-[13px] leading-5 text-neutral-600">
            {emailDraft.body}
          </p>
        </figure>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {onApprove ? (
          <Button size="md" onClick={onApprove}>
            {emailDraft ? "Approve & Send" : "Approve"}
          </Button>
        ) : null}
        {onEdit ? (
          <Button size="md" variant="secondary" onClick={onEdit}>
            Edit first
          </Button>
        ) : null}
        {onReject ? (
          <Button size="md" variant="ghost" onClick={onReject}>
            Reject
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}
