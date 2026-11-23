import { DECLARED_TOLERANCES } from "../declared-tolerances";
import type { RoundTripContract } from "../round-trip-contract";

const TIMED =
  "a ZWO interval lasts a time or a distance; the writer keeps a heart-rate-below or power-below end in kaiord attributes, and writes any other end as a 300-second interval";
const NO_TARGET =
  "a ZWO interval targets power as a share of FTP; heart rate is kept in kaiord attributes, but cadence and pace are written as no target";

/**
 * ZWO (Zwift workout XML) holds a bike or run workout as timed intervals with
 * power targets. Kaiord keeps what Zwift has no element for, the original
 * duration and target, in kaiord attributes Zwift ignores.
 */
export const ZWO_ROUND_TRIP: RoundTripContract = {
  format: "zwo",
  name: "ZWO",
  tolerances: DECLARED_TOLERANCES,
  notCarried: [
    {
      field: "extensions.structured_workout.steps.**.notes",
      reason: "a ZWO interval has no notes; a text event is a timed message",
    },
    {
      field: "extensions.structured_workout.subSport",
      reason: "a ZWO workout names only its sport type, bike or run",
    },
  ],
  filledIn: [
    {
      field: "extensions.zwift.**",
      reason:
        "the reader keeps the Zwift workout's duration type, tags and description under extensions.zwift",
    },
  ],
  unsupported: {
    durations: [
      { type: "calories", reason: TIMED },
      { type: "power_greater_than", reason: TIMED },
      { type: "repeat_until_time", reason: TIMED },
      { type: "repeat_until_distance", reason: TIMED },
      { type: "repeat_until_calories", reason: TIMED },
      { type: "repeat_until_heart_rate_greater_than", reason: TIMED },
      { type: "repeat_until_heart_rate_less_than", reason: TIMED },
      { type: "repeat_until_power_less_than", reason: TIMED },
      { type: "repeat_until_power_greater_than", reason: TIMED },
    ],
    targets: [
      { type: "cadence", unit: "rpm", reason: NO_TARGET },
      { type: "cadence", unit: "range", reason: NO_TARGET },
      { type: "pace", unit: "mps", reason: NO_TARGET },
      { type: "pace", unit: "zone", reason: NO_TARGET },
      { type: "pace", unit: "range", reason: NO_TARGET },
    ],
    intensities: [],
  },
  sports: {
    carried: ["cycling", "running"],
    reason:
      "a ZWO workout is a bike or a run: every other sport is written as one of the two",
  },
};
