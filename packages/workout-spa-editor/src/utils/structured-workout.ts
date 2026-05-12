/**
 * Structured-workout extraction helpers.
 *
 * Centralises the `krd.extensions?.structured_workout` type-guard
 * chain that previously appeared inline at 6+ call sites. The KRD
 * schema declares `extensions.structured_workout` as `unknown`, so
 * every consumer needs to re-prove the same shape (object with a
 * `steps` array, optional `name`/`sport`/`subSport`).
 */

import type { KRD } from "../types/krd";

/**
 * Minimal shape required by every consumer in this package.
 *
 * The KRD schema treats `extensions.structured_workout` as `unknown`;
 * this type captures the conventional fields without re-deriving the
 * canonical schema (kept loose for forward compatibility).
 */
export type StructuredWorkout = {
  name?: string;
  sport?: string;
  subSport?: string;
  steps: Array<unknown>;
};

/**
 * Returns the `structured_workout` payload narrowed to an object with
 * a `steps` array, or `undefined` if the field is missing/malformed.
 */
export function getStructuredWorkout(krd: KRD): StructuredWorkout | undefined {
  const data = krd.extensions?.structured_workout;
  if (!data || typeof data !== "object") return undefined;
  if (!("steps" in data) || !Array.isArray((data as { steps: unknown }).steps))
    return undefined;
  return data as StructuredWorkout;
}
