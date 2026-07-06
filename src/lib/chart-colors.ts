// Validated categorical / ordinal palette (see dataviz skill reference).
// Fixed slot order — never remapped when a filter changes which categories
// are present, so an entity keeps the same color everywhere it appears.

export const CATEGORICAL = {
  blue: "var(--chart-1)",
  aqua: "var(--chart-2)",
  yellow: "var(--chart-3)",
  green: "oklch(0.60 0.15 145)", // custom green
  violet: "var(--chart-5)",
  red: "var(--chart-4)",
  magenta: "oklch(0.65 0.18 330)",
  orange: "oklch(0.65 0.18 45)",
} as const;

// Ordinal ramp for funnel-style ordered stages (using theme variables for automatic dark mode)
export const ORDINAL_BLUE = [
  "var(--chart-1)", // primary blue/indigo
  "var(--chart-2)", // teal/emerald
  "var(--chart-3)", // yellow/amber
  "var(--chart-5)", // violet/chart-5
  "var(--chart-4)", // red/destructive
];

export const CHART_INK = {
  secondary: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "oklch(from var(--border) l c h / 0.4)", // transparent borders for grid
  baseline: "var(--border)",
};
