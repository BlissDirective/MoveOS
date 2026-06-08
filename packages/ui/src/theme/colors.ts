// Color tokens — generated from docs/design.md §2. Hex values are authoritative.
// Direction: Warm Command Center · Soft Depth / Tactile.

export const brand = {
  50: "#f0f7f4",
  100: "#dceee7",
  200: "#b8ddd0",
  300: "#87c3ac",
  400: "#5ba389",
  500: "#3d8a70", // primary brand
  600: "#2f6e59",
  700: "#275847",
  800: "#21473a",
  900: "#1c3c30",
} as const;

export const accent = {
  50: "#fffbeb",
  100: "#fef3c7",
  200: "#fde68a",
  300: "#fcd34d",
  400: "#fbbf24",
  500: "#f59e0b", // deadline / urgency
  600: "#d97706",
  700: "#b45309",
} as const;

export const neutral = {
  50: "#faf9f7", // app background
  100: "#f3f1ee",
  200: "#e8e4de", // default border
  300: "#d4cec6",
  400: "#b0a89e",
  500: "#8c8378",
  600: "#6e6560",
  700: "#524e4a",
  800: "#3a3632",
  900: "#1e1c1a", // primary text
} as const;

export const semantic = {
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
} as const;

/** The Soft Depth surface stack (docs/design.md §2 — Surface). */
export const surface = {
  base: "#faf9f7", // the desk
  sunken: "#f3f1ee", // wells/inputs below the desk
  card: "#ffffff", // paper floating above the desk
  raised: "#ffffff", // lifted further (modals/popovers)
  overlay: "rgba(30, 28, 26, 0.04)", // hover/active wash
  scrim: "rgba(30, 28, 26, 0.32)", // modal backdrop
  border: "#e8e4de", // hairline (= neutral-200)
} as const;

export const colors = { brand, accent, neutral, semantic, surface } as const;

export type ColorTokens = typeof colors;
