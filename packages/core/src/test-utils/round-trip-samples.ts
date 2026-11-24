import type { Duration } from "../domain/schemas/duration";
import type { Target } from "../domain/schemas/target";

/**
 * One sample of every KRD duration type and of every target type and unit.
 * The values sit on each format's own grid (whole watts and bpm, pace in
 * mm/s, distance in cm), so a value that moves is a conversion fault, not
 * rounding.
 */
export const ROUND_TRIP_DURATIONS: ReadonlyArray<Duration> = [
  { type: "time", seconds: 90 },
  { type: "distance", meters: 1234.5 },
  { type: "calories", calories: 50 },
  { type: "heart_rate_less_than", bpm: 130 },
  { type: "power_less_than", watts: 150 },
  { type: "power_greater_than", watts: 300 },
  { type: "repeat_until_time", seconds: 600, repeatFrom: 0 },
  { type: "repeat_until_distance", meters: 2000, repeatFrom: 0 },
  { type: "repeat_until_calories", calories: 100, repeatFrom: 0 },
  { type: "repeat_until_heart_rate_greater_than", bpm: 160, repeatFrom: 0 },
  { type: "repeat_until_heart_rate_less_than", bpm: 120, repeatFrom: 0 },
  { type: "repeat_until_power_less_than", watts: 180, repeatFrom: 0 },
  { type: "repeat_until_power_greater_than", watts: 250, repeatFrom: 0 },
  { type: "open" },
];

export const ROUND_TRIP_TARGETS: ReadonlyArray<Target> = [
  { type: "open" },
  { type: "power", value: { unit: "watts", value: 250 } },
  { type: "power", value: { unit: "percent_ftp", value: 85 } },
  { type: "power", value: { unit: "zone", value: 3 } },
  { type: "power", value: { unit: "range", min: 200, max: 250 } },
  {
    type: "power",
    value: { unit: "range", min: 80, max: 90, basis: "percent_ftp" },
  },
  { type: "heart_rate", value: { unit: "bpm", value: 145 } },
  { type: "heart_rate", value: { unit: "zone", value: 2 } },
  { type: "heart_rate", value: { unit: "percent_max", value: 75 } },
  { type: "heart_rate", value: { unit: "range", min: 130, max: 150 } },
  { type: "cadence", value: { unit: "rpm", value: 90 } },
  { type: "cadence", value: { unit: "range", min: 85, max: 95 } },
  { type: "pace", value: { unit: "mps", value: 3.5 } },
  { type: "pace", value: { unit: "zone", value: 2 } },
  { type: "pace", value: { unit: "range", min: 3.2, max: 3.8 } },
  { type: "stroke_type", value: { unit: "swim_stroke", value: 2 } },
];

/** The sport a target's step is written in: pace runs, strokes swim. */
export const sportForTarget = (target: Target): string => {
  if (target.type === "pace") return "running";
  if (target.type === "stroke_type") return "swimming";
  return "cycling";
};

/** "power/range/percent_ftp": a target's type, unit and basis. */
export const targetKey = (target: Target): string => {
  if (!("value" in target)) return target.type;
  const value = target.value as { unit: string; basis?: string };
  const basis = value.basis ? `/${value.basis}` : "";
  return `${target.type}/${value.unit}${basis}`;
};
