import { cn } from "../lib/cn";
import type { TaskPriority } from "./types";

const PRIORITY: Record<TaskPriority, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "bg-error/10 text-error" },
  high: { label: "High", cls: "bg-accent-100 text-accent-700" },
  medium: { label: "Medium", cls: "bg-neutral-100 text-neutral-600" },
  low: { label: "Low", cls: "bg-neutral-100 text-neutral-400" },
};

export interface PriorityChipProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityChip({ priority, className }: PriorityChipProps) {
  const p = PRIORITY[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-chip px-2 py-0.5 text-[11px] font-medium tracking-wide",
        p.cls,
        className,
      )}
    >
      {p.label}
    </span>
  );
}
