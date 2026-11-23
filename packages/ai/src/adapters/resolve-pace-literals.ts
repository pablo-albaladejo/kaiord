import { clockSeconds } from "./coach-clock";
import { METERS_PER_MILE, roundMilli } from "./resolve-durations";

/**
 * Pace and speed targets as the coach wrote them, turned into the m/s a
 * Workout carries:
 *
 * - `{ unit: "pace", per: "km", clock: "4:30" }` (and `clockTo` for a range)
 * - `{ unit: "split", clock: "3:10" }`: the time for the step's own distance
 * - `{ unit: "kmh" | "mph", value }` or `{ min, max }`
 *
 * Speeds are rounded to the millimetre per second. A range is always slower
 * bound first, whichever order the coach wrote it in.
 */

export type RawValue = {
  unit?: string;
  value?: number;
  min?: number;
  max?: number;
  per?: string;
  clock?: string;
  clockTo?: string;
  [key: string]: unknown;
};

export const METERS_PER: Record<string, number> = {
  km: 1000,
  mi: METERS_PER_MILE,
  "100m": 100,
  "100yd": 91.44,
  "400m": 400,
  "500m": 500,
};

const SPEED_FACTOR: Record<string, number> = {
  kmh: 1000 / 3600,
  mph: METERS_PER_MILE / 3600,
};

const speedValue = (speeds: Array<number>): RawValue => {
  const rounded = speeds.map(roundMilli);
  if (rounded.length === 1) return { unit: "mps", value: rounded[0] };
  return {
    unit: "range",
    min: Math.min(...rounded),
    max: Math.max(...rounded),
  };
};

const clocksOf = (value: RawValue): Array<string> =>
  [value.clock, value.clockTo].filter(
    (c): c is string => typeof c === "string"
  );

const overDistance = (meters: number, value: RawValue): RawValue => {
  const clocks = clocksOf(value);
  if (clocks.length === 0) throw new Error(`a ${value.unit} needs a clock`);
  return speedValue(clocks.map((c) => meters / clockSeconds(c)));
};

const paceValue = (value: RawValue): RawValue => {
  const meters = METERS_PER[value.per ?? ""];
  if (!meters) {
    throw new Error(
      `a pace needs per: one of ${Object.keys(METERS_PER).join(", ")} (got ${String(value.per)})`
    );
  }
  return overDistance(meters, value);
};

const splitValue = (value: RawValue, stepMeters?: number): RawValue => {
  if (!stepMeters) {
    throw new Error(
      "a split needs a distance duration on its step: write the distance the coach timed"
    );
  }
  return overDistance(stepMeters, value);
};

const speedLiteral = (value: RawValue, factor: number): RawValue => {
  const speeds = [value.value, value.min, value.max].filter(
    (n): n is number => typeof n === "number"
  );
  if (speeds.length === 0) throw new Error(`a ${value.unit} needs a value`);
  return speedValue(speeds.map((s) => s * factor));
};

/** The m/s value for a coach-written pace or speed; other units unchanged. */
export const resolvePaceValue = (
  value: RawValue,
  stepMeters?: number
): RawValue => {
  if (value.unit === "pace") return paceValue(value);
  if (value.unit === "split") return splitValue(value, stepMeters);
  const factor = SPEED_FACTOR[value.unit ?? ""];
  return factor ? speedLiteral(value, factor) : value;
};
