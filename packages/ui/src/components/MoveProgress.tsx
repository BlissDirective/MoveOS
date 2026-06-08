"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/cn";

/**
 * MoveProgress — the dashboard hero (docs/design.md §4). A days-until-move
 * countdown inside an animated task-completion ring. The ring fill springs to
 * its value on mount and increments as tasks complete.
 */
export interface MoveProgressProps {
  daysUntilMove: number;
  tasksCompleted: number;
  taskCount: number;
  /** Pixel diameter of the ring. Default 220. */
  size?: number;
  className?: string;
}

export function MoveProgress({
  daysUntilMove,
  tasksCompleted,
  taskCount,
  size = 220,
  className,
}: MoveProgressProps) {
  const reduce = useReducedMotion();
  const stroke = Math.round(size * 0.055);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = taskCount > 0 ? Math.min(tasksCompleted / taskCount, 1) : 0;
  const offset = c * (1 - progress);

  const days = Math.max(daysUntilMove, 0);

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`${tasksCompleted} of ${taskCount} tasks done, ${days} days until move`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-neutral-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          className="stroke-brand-500"
          initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">
        <div className="flex flex-col items-center">
          <span className="text-[44px] font-extrabold leading-none tracking-[-1.5px] text-neutral-900">
            {daysUntilMove <= 0 ? "0" : days}
          </span>
          <span className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            {daysUntilMove <= 0 ? "moving day" : "days to go"}
          </span>
          <span className="mt-3 text-[13px] font-medium text-brand-700">
            {tasksCompleted}/{taskCount} tasks done
          </span>
        </div>
      </div>
    </div>
  );
}
