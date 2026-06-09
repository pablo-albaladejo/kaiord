import type { Sport } from "./sport";

/**
 * Coarse capability category for a sport. Behavioural logic (zone/threshold
 * models, lossy adapter collapse to TCX/ZWO) branches on this category, never
 * on the open-ended {@link Sport} identity — so widening the sport vocabulary
 * never requires touching that logic. `other` is the default and behaves like
 * `generic` (no power/pace model; collapses to TCX `Other`).
 */
export type SportCategory = "cycling" | "running" | "swimming" | "other";

const CYCLING: ReadonlySet<Sport> = new Set<Sport>(["cycling", "e_biking"]);

const RUNNING: ReadonlySet<Sport> = new Set<Sport>([
  "running",
  "walking",
  "hiking",
]);

const SWIMMING: ReadonlySet<Sport> = new Set<Sport>(["swimming"]);

/**
 * Classify a sport into its capability category. Unknown / non-endurance
 * sports (training, rowing, tennis, …) fall through to `other`.
 */
export const sportCategory = (sport: Sport): SportCategory => {
  if (CYCLING.has(sport)) return "cycling";
  if (RUNNING.has(sport)) return "running";
  if (SWIMMING.has(sport)) return "swimming";
  return "other";
};
