/**
 * FIT epoch-seconds <-> ISO-8601 timestamp conversion.
 *
 * FIT stores timestamps as integer seconds since the FIT epoch; the
 * Garmin SDK may surface a decoded message timestamp as a `Date`, a
 * raw `number` (epoch seconds), or a pre-formatted `string`. This
 * module centralizes the single `* 1000` seconds->millis factor and
 * the `Date | number | string` branching that was previously
 * copy-pasted across every health converter and the event mapper, so
 * the unit convention lives in exactly one place.
 */

const SECONDS_TO_MILLIS = 1000;

/**
 * Normalizes a decoded FIT timestamp to an ISO-8601 string.
 * - `Date`: serialized directly.
 * - `number`: treated as FIT epoch seconds (scaled by 1000).
 * - `string`: parsed via `new Date(...)`.
 */
export const fitTimestampToIso = (value: Date | number | string): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    return new Date(value * SECONDS_TO_MILLIS).toISOString();
  }
  return new Date(value).toISOString();
};

/**
 * Inverse of {@link fitTimestampToIso} for the number branch: converts
 * an ISO-8601 string back to FIT epoch seconds (floored).
 */
export const isoToFitTimestampSeconds = (iso: string): number =>
  Math.floor(new Date(iso).getTime() / SECONDS_TO_MILLIS);
