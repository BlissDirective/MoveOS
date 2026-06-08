import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Input — a sunken (inset) field per docs/design.md §4. Sits *below* the desk;
 * focus lifts it to white with the brand halo.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-sm border border-neutral-200 bg-surface-sunken px-3",
        "text-[15px] text-neutral-900 shadow-[var(--shadow-inset)] outline-none",
        "transition-colors placeholder:text-neutral-400",
        "focus-visible:border-brand-400 focus-visible:bg-surface-card focus-visible:ring-[3px] focus-visible:ring-brand-300",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

/** Labelled form row: label + control + optional hint/error. */
export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {error ? (
        <span className="text-[12px] text-error">{error}</span>
      ) : hint ? (
        <span className="text-[12px] text-neutral-500">{hint}</span>
      ) : null}
    </div>
  );
}
