// Design tokens — the TS source of truth, generated from docs/design.md.
// docs/design.md is authoritative; if these disagree, update code to match it.

export * from "./colors";
export * from "./typography";
export * from "./spacing";
export * from "./elevation";
export * from "./motion";

import { colors } from "./colors";
import { typography, fontFamily } from "./typography";
import { spacing, radius, pagePadding } from "./spacing";
import { elevation } from "./elevation";
import { motion } from "./motion";

/** The full token set as one object (handy for the Tailwind preset). */
export const theme = {
  colors,
  typography,
  fontFamily,
  spacing,
  radius,
  pagePadding,
  elevation,
  motion,
} as const;

export type Theme = typeof theme;
