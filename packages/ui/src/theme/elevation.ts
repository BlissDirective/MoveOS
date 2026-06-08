// Elevation tokens — the heart of Direction C (docs/design.md §6).
//
// A 5-step ladder of layered, WARM-tinted soft shadows (tight contact shadow +
// wide ambient shadow), one top-down light source. Shadow color is always
// neutral-900 (30,28,26) at low alpha — never pure black. Elevation encodes
// status: actionable floats high (e2–e4), completed sinks (e0).

export const elevation = {
  e0: "0 1px 2px rgba(30, 28, 26, 0.04)",
  e1: "0 1px 2px rgba(30, 28, 26, 0.05), 0 2px 6px rgba(30, 28, 26, 0.04)",
  e2: "0 1px 3px rgba(30, 28, 26, 0.06), 0 6px 16px rgba(30, 28, 26, 0.05)",
  e3: "0 2px 6px rgba(30, 28, 26, 0.07), 0 12px 28px rgba(30, 28, 26, 0.07)",
  e4: "0 4px 12px rgba(30, 28, 26, 0.08), 0 24px 48px rgba(30, 28, 26, 0.10)",
  inset: "inset 0 1px 2px rgba(30, 28, 26, 0.05)",
} as const;

export type ElevationTokens = typeof elevation;
