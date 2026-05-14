/**
 * Internal helpers for `healSessionMatchIdShape`. Extracted so the use
 * case file stays under the per-file/per-function line caps.
 */

import { buildCoachingActivityId } from "../../types/coaching-activity-record";
import type { SessionMatch } from "../../types/session-match";
import type { HealSessionMatchIdShapeDeps } from "./heal-session-match-id-shape-types";

const stripProfilePrefix = (
  profileId: string,
  namespacedSourceId: string | null
): string | null => {
  if (!namespacedSourceId) return null;
  const prefix = `${profileId}:`;
  return namespacedSourceId.startsWith(prefix)
    ? namespacedSourceId.slice(prefix.length)
    : null;
};

/**
 * Resolves the canonical COMPOSITE `coachingActivityId` for a match
 * row by reading the linked workout's `(source, sourceId)` and
 * un-namespacing the `sourceId` from `${profileId}:${rawSourceId}` back
 * to `rawSourceId`. Returns `null` if the workout side cannot be
 * reconstructed (a true H8 dangling workout, not an id-shape bug).
 */
export const resolveCanonicalActivityId = async (
  match: SessionMatch,
  deps: HealSessionMatchIdShapeDeps
): Promise<string | null> => {
  const workout = await deps.workouts.getById(match.workoutId);
  if (!workout) return null;
  const rawSourceId = stripProfilePrefix(match.profileId, workout.sourceId);
  if (!rawSourceId) return null;
  return buildCoachingActivityId(match.profileId, workout.source, rawSourceId);
};
