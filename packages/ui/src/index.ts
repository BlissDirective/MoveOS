// @moveros/ui — shared design system.
//
// Direction: Warm Command Center · Soft Depth / Tactile (docs/design.md).
//   • ./theme              — TS design tokens (source of truth in code).
//   • ./styles/tokens.css  — Tailwind v4 @theme tokens for web (CSS vars +
//                            generated utilities).
// The component kit (Button, TaskCard, ApprovalCard, AgentStatusBadge,
// MoveProgress) is built next, on top of these tokens.

export const UI_PACKAGE = "@moveros/ui" as const;
export * from "./theme";
