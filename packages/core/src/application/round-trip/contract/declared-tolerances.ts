import type { FieldTolerance } from "./round-trip-contract";

const TARGET = "extensions.structured_workout.**.target.value.*";
const DURATION = "extensions.structured_workout.**.duration";

/**
 * The Round-trip tolerances, declared once for every format: time ±1 s,
 * distance ±1 m, power ±1 W or ±1 % FTP, heart rate ±1 bpm or ±0.5 % of
 * maximum, cadence ±1 rpm, pace ±0.01 m/s. Any number not covered here must come back exactly: a
 * zone, a stroke, a repeat count, a calorie count, a pool length.
 */
export const DECLARED_TOLERANCES: ReadonlyArray<FieldTolerance> = [
  {
    field: `${DURATION}.seconds`,
    tolerance: 1,
    reason: "time ±1 s: a step written in whole seconds keeps its value",
  },
  {
    field: `${DURATION}.meters`,
    tolerance: 1,
    reason:
      "distance ±1 m: FIT holds distance in whole centimetres, the other formats in metres; ±1 m is the validator's default",
  },
  {
    field: `${DURATION}.bpm`,
    tolerance: 1,
    reason: "heart rate ±1 bpm: formats hold whole beats per minute",
  },
  {
    field: `${DURATION}.watts`,
    tolerance: 1,
    reason: "power ±1 W: formats hold whole watts",
  },
  {
    field: TARGET,
    targetType: "power",
    units: ["watts", "range", "percent_ftp"],
    tolerance: 1,
    reason: "power ±1 W or ±1 % FTP: whole watts, or a percentage of FTP",
  },
  {
    field: TARGET,
    targetType: "heart_rate",
    units: ["bpm", "range"],
    tolerance: 1,
    reason: "heart rate ±1 bpm: formats hold whole beats per minute",
  },
  {
    field: TARGET,
    targetType: "heart_rate",
    units: ["percent_max"],
    tolerance: 0.5,
    reason:
      "heart rate as a share of maximum ±0.5 %: FIT holds whole percent, so rounding moves it at most half a percent, under 1 bpm for any maximum up to 200 bpm",
  },
  {
    field: TARGET,
    targetType: "cadence",
    units: ["rpm", "range"],
    tolerance: 1,
    reason: "cadence ±1 rpm: formats hold whole revolutions per minute",
  },
  {
    field: TARGET,
    targetType: "pace",
    units: ["mps", "range"],
    tolerance: 0.01,
    reason: "pace ±0.01 m/s: FIT holds speed in mm/s, others in m/s",
  },
];
