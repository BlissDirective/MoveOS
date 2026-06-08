// Spacing + radius tokens — generated from docs/design.md §5 (seed: spec §4.5).
// Base unit 4px.

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const radius = {
  chip: 4,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Horizontal page padding by surface width (docs/design.md §5). */
export const pagePadding = {
  mobile: 16,
  tablet: 24,
  web: 32,
} as const;

export type SpacingTokens = typeof spacing;
export type RadiusTokens = typeof radius;
