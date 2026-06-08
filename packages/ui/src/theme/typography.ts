// Typography tokens — generated from docs/design.md §3 (seed: spec §4.3).
// Sizes/line-heights in px; letterSpacing in px. Consumed by the Tailwind preset.

export const fontFamily = {
  display: "'Plus Jakarta Sans', sans-serif",
  body: "'Plus Jakarta Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export interface TypeStyle {
  readonly size: number;
  readonly weight: number;
  readonly lineHeight: number;
  readonly letterSpacing: number;
  readonly mono?: boolean;
}

export const typography = {
  display2xl: { size: 72, weight: 800, lineHeight: 80, letterSpacing: -2.5 },
  displayXl: { size: 48, weight: 800, lineHeight: 56, letterSpacing: -1.5 },
  displayLg: { size: 36, weight: 700, lineHeight: 44, letterSpacing: -1.0 },

  h1: { size: 28, weight: 700, lineHeight: 36, letterSpacing: -0.5 },
  h2: { size: 22, weight: 600, lineHeight: 30, letterSpacing: -0.3 },
  h3: { size: 18, weight: 600, lineHeight: 26, letterSpacing: -0.2 },
  h4: { size: 16, weight: 600, lineHeight: 24, letterSpacing: 0 },

  bodyLg: { size: 17, weight: 400, lineHeight: 26, letterSpacing: 0 },
  bodyMd: { size: 15, weight: 400, lineHeight: 23, letterSpacing: 0 },
  bodySm: { size: 13, weight: 400, lineHeight: 20, letterSpacing: 0 },

  labelLg: { size: 14, weight: 500, lineHeight: 20, letterSpacing: 0.1 },
  labelMd: { size: 12, weight: 500, lineHeight: 18, letterSpacing: 0.2 },
  labelSm: { size: 11, weight: 500, lineHeight: 16, letterSpacing: 0.3 },

  monoMd: { size: 13, weight: 400, lineHeight: 20, letterSpacing: 0, mono: true },
  monoSm: { size: 11, weight: 400, lineHeight: 16, letterSpacing: 0, mono: true },
} as const satisfies Record<string, TypeStyle>;

export type TypographyTokens = typeof typography;
