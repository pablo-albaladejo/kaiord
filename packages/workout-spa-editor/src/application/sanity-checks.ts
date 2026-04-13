/**
 * KRD Sanity Checks
 *
 * Post-LLM validation: ensures generated workouts have
 * reasonable duration and step count.
 */

import type { KRD } from "../types/schemas";

const MIN_DURATION_S = 60;
const MAX_DURATION_S = 28800;
const MIN_STEPS = 1;
const MAX_STEPS = 200;

export function validateSanity(krd: KRD): string | null {
  const steps = extractSteps(krd);
  if (steps !== null && (steps < MIN_STEPS || steps > MAX_STEPS)) {
    return `Step count ${steps} outside valid range (${MIN_STEPS}-${MAX_STEPS})`;
  }

  const duration = extractDurationSeconds(krd);
  if (
    duration !== null &&
    (duration < MIN_DURATION_S || duration > MAX_DURATION_S)
  ) {
    return `Duration ${duration}s outside valid range (1min-8h)`;
  }

  return null;
}

function extractSteps(krd: KRD): number | null {
  const workout = krd.extensions?.["structured_workout"];
  if (!workout || typeof workout !== "object") return null;
  const w = workout as Record<string, unknown>;
  if (!Array.isArray(w["steps"])) return null;
  return w["steps"].length;
}

function extractDurationSeconds(krd: KRD): number | null {
  const workout = krd.extensions?.["structured_workout"];
  if (!workout || typeof workout !== "object") return null;
  const w = workout as Record<string, unknown>;
  if (typeof w["estimatedDuration"] === "number") {
    return w["estimatedDuration"];
  }
  return null;
}
