import { forwardRef } from "react";
import { cn } from "../lib/cn";

/** Multi-line input styled to match Input (sunken/inset per docs/design.md §4). */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-sm border border-neutral-200 bg-surface-sunken px-3 py-2",
        "text-[14px] leading-5 text-neutral-900 shadow-[var(--shadow-inset)] outline-none transition-colors",
        "placeholder:text-neutral-400",
        "focus-visible:border-brand-400 focus-visible:bg-surface-card focus-visible:ring-[3px] focus-visible:ring-brand-300",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
