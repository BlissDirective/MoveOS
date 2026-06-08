// @moveros/ui — shared design system.
//
// Direction: Warm Command Center · Soft Depth / Tactile (docs/design.md).
//   • ./theme              — TS design tokens (source of truth in code).
//   • ./styles/tokens.css  — Tailwind v4 @theme tokens for web (CSS vars +
//                            generated utilities).
//   • components           — Button, AgentStatusBadge, PriorityChip, TaskCard,
//                            ApprovalCard, MoveProgress (built on the tokens).

export const UI_PACKAGE = "@moveros/ui" as const;
export * from "./theme";
export * from "./components";
export { cn } from "./lib/cn";
