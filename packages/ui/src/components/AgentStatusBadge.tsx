import { cn } from "../lib/cn";
import type { AgentTaskStatus } from "./types";

interface StatusStyle {
  readonly label: string;
  readonly dot: string;
  readonly text: string;
  readonly bg: string;
  readonly pulse?: boolean;
}

const STATUS: Record<AgentTaskStatus, StatusStyle> = {
  queued: { label: "Queued", dot: "bg-neutral-400", text: "text-neutral-600", bg: "bg-neutral-100" },
  running: { label: "Working", dot: "bg-info", text: "text-info", bg: "bg-info/10", pulse: true },
  awaiting_approval: { label: "Review", dot: "bg-accent-500", text: "text-accent-700", bg: "bg-accent-100" },
  completed: { label: "Done", dot: "bg-success", text: "text-brand-700", bg: "bg-brand-50" },
  failed: { label: "Failed", dot: "bg-error", text: "text-error", bg: "bg-error/10" },
  cancelled: { label: "Cancelled", dot: "bg-neutral-400", text: "text-neutral-500", bg: "bg-neutral-100" },
};

export interface AgentStatusBadgeProps {
  status: AgentTaskStatus;
  /** Override the default label (e.g. "Agent working…"). */
  label?: string;
  className?: string;
}

/** Machine-fact badge for an agent run's status (mono, status-colored). */
export function AgentStatusBadge({ status, label, className }: AgentStatusBadgeProps) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1",
        "font-mono text-[11px] font-medium",
        s.bg,
        s.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot, s.pulse && "animate-pulse")} />
      {label ?? s.label}
    </span>
  );
}
