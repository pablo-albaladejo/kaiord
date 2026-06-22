/**
 * Activity-level NEAT factors applied to the predicted basal expenditure.
 *
 * These multipliers are deliberately LOWER than the classic TDEE activity
 * multipliers (which run ~1.2–1.9). The predicted expenditure already adds
 * scheduled-workout energy separately via `expectedActivityKcal`, so the factor
 * here only covers Non-Exercise Activity Thermogenesis (NEAT) — daily movement,
 * posture, fidgeting, occupational activity — NOT structured exercise. Using a
 * full TDEE multiplier would double-count the workout kcal.
 *
 * The default (unset activity level) is `sedentary` (1.2), the most conservative
 * assumption, so an incomplete profile never over-states maintenance.
 */

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

/** NEAT factor used when the profile has no `activityLevel` set. */
export const DEFAULT_NEAT_FACTOR = 1.2;

/** NEAT-only multipliers per activity level (workout kcal added separately). */
export const NEAT_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.3,
  moderate: 1.4,
  active: 1.5,
  very_active: 1.6,
};

/**
 * Resolve the NEAT multiplier for an activity level, falling back to
 * `DEFAULT_NEAT_FACTOR` when the level is unset (`undefined`/`null`).
 */
export const neatFactorForActivityLevel = (
  level?: ActivityLevel | null
): number => (level ? NEAT_FACTOR[level] : DEFAULT_NEAT_FACTOR);
