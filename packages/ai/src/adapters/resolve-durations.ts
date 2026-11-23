/**
 * The model copies the coach's numbers into the unit they were written in
 * (`{ minutes: 3, seconds: 30 }`, `{ kilometers: 1.5 }`); this turns them into
 * the seconds and metres a Workout carries. A duration already in seconds or
 * metres alone is returned as it is.
 */

export type RawDuration = {
  type?: string;
  hours?: number;
  minutes?: number;
  seconds?: number;
  meters?: number;
  kilometers?: number;
  miles?: number;
  [key: string]: unknown;
};

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const METERS_PER_KM = 1000;
export const METERS_PER_MILE = 1609.344;
const DECIMALS = 1000;

/** Drops floating-point noise (0.1 km is 100 m, not 100.00000000000001). */
export const roundMilli = (n: number) => Math.round(n * DECIMALS) / DECIMALS;

const TIME_PARTS = ["hours", "minutes", "seconds"] as const;
const DISTANCE_PARTS = ["meters", "kilometers", "miles"] as const;

const has = (d: RawDuration, parts: ReadonlyArray<keyof RawDuration>) =>
  parts.some((p) => typeof d[p] === "number");

const without = (d: RawDuration, parts: ReadonlyArray<string>) =>
  Object.fromEntries(Object.entries(d).filter(([k]) => !parts.includes(k)));

const totalSeconds = (d: RawDuration) =>
  roundMilli(
    (d.hours ?? 0) * SECONDS_PER_HOUR +
      (d.minutes ?? 0) * SECONDS_PER_MINUTE +
      (d.seconds ?? 0)
  );

const totalMeters = (d: RawDuration) =>
  roundMilli(
    (d.meters ?? 0) +
      (d.kilometers ?? 0) * METERS_PER_KM +
      (d.miles ?? 0) * METERS_PER_MILE
  );

const TIMED = new Set(["time", "repeat_until_time"]);
const MEASURED = new Set(["distance", "repeat_until_distance"]);

export const resolveDuration = (d: RawDuration): RawDuration => {
  if (TIMED.has(d.type ?? "") && has(d, TIME_PARTS))
    return { ...without(d, TIME_PARTS), seconds: totalSeconds(d) };
  if (MEASURED.has(d.type ?? "") && has(d, DISTANCE_PARTS))
    return { ...without(d, DISTANCE_PARTS), meters: totalMeters(d) };
  return d;
};
