import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

// Tactile press is pure CSS (active:translate-y + shadow drop), so Button needs
// no client boundary of its own (docs/design.md §4 — Buttons).
const button = cva(
  "inline-flex select-none items-center justify-center gap-2 font-medium " +
    "transition-[background-color,transform,box-shadow] duration-150 ease-out " +
    "focus-visible:outline-none focus-visible:ring-[3px] " +
    "disabled:pointer-events-none active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "rounded-md bg-brand-500 text-white shadow-e1 hover:bg-brand-600 " +
          "active:bg-brand-700 active:shadow-e0 focus-visible:ring-brand-300 " +
          "disabled:bg-brand-300 disabled:shadow-none",
        secondary:
          "rounded-sm border border-neutral-300 bg-surface-card text-neutral-700 " +
          "shadow-e1 hover:bg-neutral-50 active:bg-neutral-100 active:shadow-e0 " +
          "focus-visible:ring-brand-300 disabled:opacity-50",
        ghost:
          "rounded-sm text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 " +
          "focus-visible:ring-brand-300 disabled:opacity-40",
        danger:
          "rounded-md bg-error text-white shadow-e1 hover:brightness-95 " +
          "active:brightness-90 active:shadow-e0 focus-visible:ring-error/40 " +
          "disabled:opacity-50",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled ?? isLoading}
      className={cn(button({ variant, size }), className)}
      {...props}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2Z"
      />
    </svg>
  );
}
