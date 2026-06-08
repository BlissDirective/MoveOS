import { forwardRef } from "react";
import { cn } from "../lib/cn";

/** Native select styled to match Input (sunken/inset per docs/design.md §4). */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-sm border border-neutral-200 bg-surface-sunken px-3",
        "text-[15px] text-neutral-900 shadow-[var(--shadow-inset)] outline-none transition-colors",
        "focus-visible:border-brand-400 focus-visible:bg-surface-card focus-visible:ring-[3px] focus-visible:ring-brand-300",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
