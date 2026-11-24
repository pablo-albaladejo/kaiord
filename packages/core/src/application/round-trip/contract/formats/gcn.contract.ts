import type { RoundTripContract } from "../round-trip-contract";

const END =
  "the writer ends a Garmin Connect step on time, distance, calories or a lap-button press; any other end is written as a lap-button press";
const BAND =
  "Garmin Connect targets are bands: a single value is sent as the band around it (power ±5 % and at least ±5 W, heart rate and cadence ±3, pace ±5 s/km) and comes back as that range";
const FTP =
  "a share of FTP is sent as watts with the FTP the writer is given, and comes back in watts";

/**
 * GCN (the Garmin Connect workout JSON) holds running, cycling, swimming and
 * cardio workouts with repeat groups, step notes, and power, heart-rate,
 * pace and cadence ranges.
 */
export const GCN_ROUND_TRIP: RoundTripContract = {
  format: "gcn",
  name: "GCN",
  notCarried: [
    {
      field: "metadata.created",
      reason:
        "Garmin Connect stamps createdDate on its server; the writer sends none and the reader stamps the time it reads",
    },
    {
      field: "extensions.structured_workout.steps.**.name",
      reason: "a Garmin Connect step has a description but no name",
    },
    {
      field: "extensions.structured_workout.subSport",
      reason: "the Garmin Connect workout API takes no sub-sport",
    },
  ],
  filledIn: [
    {
      field: "metadata.manufacturer",
      reason: "the reader names garmin-connect as the source of the workout",
    },
  ],
  unsupported: {
    durations: [
      { type: "heart_rate_less_than", reason: END },
      { type: "power_less_than", reason: END },
      { type: "power_greater_than", reason: END },
      { type: "repeat_until_time", reason: END },
      { type: "repeat_until_distance", reason: END },
      { type: "repeat_until_calories", reason: END },
      { type: "repeat_until_heart_rate_greater_than", reason: END },
      { type: "repeat_until_heart_rate_less_than", reason: END },
      { type: "repeat_until_power_less_than", reason: END },
      { type: "repeat_until_power_greater_than", reason: END },
    ],
    targets: [
      { type: "power", unit: "watts", reason: BAND },
      { type: "power", unit: "percent_ftp", reason: FTP },
      { type: "power", unit: "range", basis: "percent_ftp", reason: FTP },
      { type: "heart_rate", unit: "bpm", reason: BAND },
      {
        type: "heart_rate",
        unit: "percent_max",
        reason:
          "a share of maximum heart rate is sent as the bpm band around it, with the maximum the writer is given",
      },
      { type: "cadence", unit: "rpm", reason: BAND },
      { type: "pace", unit: "mps", reason: BAND },
      {
        type: "pace",
        unit: "zone",
        reason:
          "Garmin Connect has no pace zone numbers; the writer refuses one unless it is given the athlete's pace zones",
      },
    ],
    intensities: [
      {
        intensity: "interval",
        reason:
          "Garmin Connect has one interval step type for KRD active, interval and other",
      },
      {
        intensity: "other",
        reason:
          "Garmin Connect has one interval step type for KRD active, interval and other",
      },
    ],
  },
  sports: {
    carried: ["running", "cycling", "swimming", "generic"],
    reason:
      "a Garmin Connect workout is running, cycling, swimming or cardio: every other sport is written as cardio and read back as generic",
  },
};
