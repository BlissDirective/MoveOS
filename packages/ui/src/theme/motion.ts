// Motion tokens — generated from docs/design.md §9 (seed: spec §4.6).
// Personality: "settled weight" — quick to respond, soft to arrive. Physical,
// short, never decorative on data surfaces. Always honor prefers-reduced-motion.

/** Durations in ms. */
export const duration = {
  instant: 80, // hover, focus rings
  fast: 150, // button press, chip toggle
  normal: 250, // card appear, modal open
  slow: 400, // page transition, progress ring
  verySlow: 600, // the task-complete celebration
} as const;

/** Cubic-bezier easing curves (Framer Motion array form). */
export const easing = {
  easeOut: [0.16, 1, 0.3, 1] as const, // most UI
  easeInOut: [0.45, 0, 0.55, 1] as const, // modal open/close
} as const;

/** Spring presets (Framer Motion). */
export const spring = {
  press: { type: "spring", stiffness: 400, damping: 30 } as const,
  celebration: { type: "spring", stiffness: 200, damping: 15 } as const,
} as const;

/** Tactile press: depress + scale on :active, settle on release. */
export const tactile = {
  pressScale: 0.97,
  pressTranslateY: 1, // px, pairs with dropping one elevation step
  hoverLiftY: -2, // px, pairs with rising one elevation step
} as const;

export const motion = { duration, easing, spring, tactile } as const;

export type MotionTokens = typeof motion;
