/**
 * Maps a profile's activity level to a non-exercise activity (NEAT) factor that
 * scales BMR for the predicted basal expenditure. The factor covers everyday
 * non-exercise movement only; scheduled workouts are added separately as
 * expected activity kcal, so they are never double-counted. An unset level
 * falls back to 1 (BMR alone), preserving the pre-NEAT estimate.
 *
 * Factors sit below standard TDEE multipliers (which bake in exercise): a
 * moderately active 80 kg / 180 cm male (BMR ~1750) lands at ~2450 kcal
 * maintenance on a rest day, the realistic range the raw BMR underestimated.
 */
import type { ActivityLevel } from "../../types/profile";

const NEAT_FACTOR_BY_ACTIVITY_LEVEL: Record<ActivityLevel, number> = {
  sedentary: 1.15,
  light: 1.3,
  moderate: 1.4,
  active: 1.5,
  very_active: 1.6,
};

const DEFAULT_NEAT_FACTOR = 1;

/** NEAT multiplier for `level`, or 1 (BMR alone) when the level is unset. */
export const neatFactorForActivityLevel = (
  level: ActivityLevel | undefined
): number =>
  level === undefined
    ? DEFAULT_NEAT_FACTOR
    : NEAT_FACTOR_BY_ACTIVITY_LEVEL[level];
