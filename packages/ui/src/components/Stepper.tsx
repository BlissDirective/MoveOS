import { cn } from "../lib/cn";

export interface StepperProps {
  steps: string[];
  /** Zero-based index of the active step. */
  current: number;
  className?: string;
}

/** Horizontal progress indicator for multi-step flows (onboarding wizard). */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                  state === "done" && "bg-brand-500 text-white",
                  state === "current" && "bg-brand-100 text-brand-700 ring-2 ring-brand-300",
                  state === "upcoming" && "bg-neutral-100 text-neutral-400",
                )}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-[13px] font-medium sm:inline",
                  state === "upcoming" ? "text-neutral-400" : "text-neutral-700",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span
                className={cn(
                  "mx-3 h-px flex-1 transition-colors",
                  i < current ? "bg-brand-300" : "bg-neutral-200",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
