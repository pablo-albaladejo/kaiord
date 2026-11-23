import { DECLARED_TOLERANCES } from "../declared-tolerances";
import type { RoundTripContract } from "../round-trip-contract";

const NO_REPEAT_UNTIL =
  "a TCX step ends on time, distance, heart rate or calories, or when the athlete presses lap; a repeat is a Repeat_t block, never a step that repeats until a condition";
const POWER =
  "TCX has no power target: a single watt value survives only as the Garmin TPX extension, and a range, a zone or a percentage of FTP is written as no target";

/**
 * TCX (Training Center Database v2) holds a workout as Running, Biking or
 * Other steps with time, distance, heart-rate and calorie durations, and
 * heart-rate, speed and cadence targets.
 */
export const TCX_ROUND_TRIP: RoundTripContract = {
  format: "tcx",
  name: "TCX",
  tolerances: DECLARED_TOLERANCES,
  notCarried: [
    {
      field: "extensions.structured_workout.steps.**.notes",
      reason: "a TCX step has a name but no notes",
    },
    {
      field: "extensions.structured_workout.subSport",
      reason: "a TCX workout names only its sport",
    },
  ],
  filledIn: [
    {
      field: "extensions.structured_workout.steps.**.extensions.tcx.**",
      reason:
        "the reader keeps the TPX power extension a step is written with under the step's extensions.tcx",
    },
  ],
  unsupported: {
    durations: [
      { type: "repeat_until_time", reason: NO_REPEAT_UNTIL },
      { type: "repeat_until_distance", reason: NO_REPEAT_UNTIL },
      { type: "repeat_until_calories", reason: NO_REPEAT_UNTIL },
      { type: "repeat_until_heart_rate_greater_than", reason: NO_REPEAT_UNTIL },
      { type: "repeat_until_heart_rate_less_than", reason: NO_REPEAT_UNTIL },
      { type: "repeat_until_power_less_than", reason: NO_REPEAT_UNTIL },
      { type: "repeat_until_power_greater_than", reason: NO_REPEAT_UNTIL },
    ],
    targets: [
      { type: "power", unit: "percent_ftp", reason: POWER },
      { type: "power", unit: "zone", reason: POWER },
      { type: "power", unit: "range", reason: POWER },
      { type: "power", unit: "range", basis: "percent_ftp", reason: POWER },
      {
        type: "heart_rate",
        unit: "bpm",
        reason:
          "a TCX heart-rate target is a zone with a low and a high bound, so a single bpm comes back as the range from that bpm to itself",
      },
      {
        type: "heart_rate",
        unit: "percent_max",
        reason: "a TCX heart-rate zone is in bpm, not a percentage of maximum",
      },
      {
        type: "pace",
        unit: "zone",
        reason:
          "a TCX speed target is a custom range in m/s, not a zone number",
      },
    ],
    intensities: [
      { intensity: "recovery", reason: "TCX Intensity is Active or Resting" },
      { intensity: "interval", reason: "TCX Intensity is Active or Resting" },
      { intensity: "other", reason: "TCX Intensity is Active or Resting" },
    ],
  },
  sports: {
    carried: ["running", "cycling", "generic"],
    reason:
      "a TCX workout is Running, Biking or Other: every other sport is written as one of the three",
  },
};
