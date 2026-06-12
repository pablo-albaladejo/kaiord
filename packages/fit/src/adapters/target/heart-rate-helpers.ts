/**
 * FIT absolute-bpm offset rule.
 *
 * The FIT `targetValue` field for a heart-rate target overloads one
 * integer to carry either a %max-HR percentage or an absolute bpm:
 * - Values 0-100: Percentage of max HR (direct)
 * - Values > 100: Absolute bpm, stored offset by +100 (value - 100)
 *
 * This single constant owns the offset for BOTH directions so the
 * encode (`encodeWorkoutHeartRate`) and decode (`interpretWorkoutHeartRate`)
 * sides cannot drift, mirroring `power-helpers.ts` for the +1000 watts
 * offset.
 */
const BPM_OFFSET = 100;

/**
 * Interprets a heart-rate `targetValue` read from FIT.
 * - Values > 100: Absolute bpm (value - BPM_OFFSET)
 * - Values 0-100: Percentage of max HR (direct)
 */
export const interpretWorkoutHeartRate = (
  value: number
): { type: "bpm" | "percent_max"; value: number } => {
  if (value > BPM_OFFSET) {
    return {
      type: "bpm",
      value: value - BPM_OFFSET,
    };
  }
  return {
    type: "percent_max",
    value,
  };
};

/**
 * Encodes a single bpm value to its FIT `targetValue` representation.
 * Absolute bpm is stored with the +BPM_OFFSET applied so it cannot
 * collide with the 0-100 %max-HR range on decode.
 */
export const encodeWorkoutHeartRate = (bpm: number): number => bpm + BPM_OFFSET;
