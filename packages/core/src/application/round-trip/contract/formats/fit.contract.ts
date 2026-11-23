import { DECLARED_TOLERANCES } from "../declared-tolerances";
import type { RoundTripContract } from "../round-trip-contract";

/**
 * FIT holds every KRD duration, target, intensity and sport of a workout.
 * Its integer scaling (time in ms, distance in cm, speed in mm/s, power in
 * whole watts) sits inside the declared tolerances.
 */
export const FIT_ROUND_TRIP: RoundTripContract = {
  format: "fit",
  name: "FIT",
  tolerances: DECLARED_TOLERANCES,
  notCarried: [
    {
      field: "extensions.structured_workout.**.stepIndex",
      reason:
        "FIT numbers a repeat block as a step of its own, so the steps after a block are renumbered; KRD reads step order from the list, not from stepIndex",
    },
  ],
  filledIn: [
    {
      field: "metadata.manufacturer",
      reason:
        "a FIT file_id names a manufacturer, so the writer writes garmin when the KRD names none",
    },
    {
      field: "extensions.fit",
      reason:
        "the reader keeps FIT developer fields under extensions.fit, an empty object when the file has none",
    },
  ],
  unsupported: { durations: [], targets: [], intensities: [] },
  sports: { carried: "all", reason: "FIT carries every KRD sport" },
};
