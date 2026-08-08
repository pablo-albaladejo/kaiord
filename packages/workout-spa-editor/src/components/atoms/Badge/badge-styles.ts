import type { BadgeSize, BadgeVariant } from "./Badge";

/**
 * One neutral chip for every variant.
 *
 * These fourteen variants used to carry thirteen hues — blue, cyan, indigo,
 * teal, pink, purple and the rest — for two unrelated things: a step's
 * intensity and what its target measures. Thirteen arbitrary hues compete
 * with the only colour on these screens that means something (the five zone
 * hues), and none of them was ever the signal: the chip says "warmup" or
 * "power" in words, right there.
 *
 * Kept as a per-variant record rather than a single constant so a variant
 * that later earns a distinct treatment has a place to land without churning
 * every call site.
 */
const CHIP = "bg-surface-elevated text-ink-body border-edge";

export const variantClasses: Record<BadgeVariant, string> = {
  warmup: CHIP,
  active: CHIP,
  cooldown: CHIP,
  rest: CHIP,
  recovery: CHIP,
  interval: CHIP,
  other: CHIP,
  power: CHIP,
  heart_rate: CHIP,
  cadence: CHIP,
  pace: CHIP,
  stroke_type: CHIP,
  open: CHIP,
  default: CHIP,
};

export const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};
