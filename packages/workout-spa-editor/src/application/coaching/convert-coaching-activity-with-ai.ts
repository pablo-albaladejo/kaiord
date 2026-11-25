/**
 * convertCoachingActivityWithAi — application use case.
 *
 * Synchronously runs the AI pipeline (LLM → KRD) and persists the
 * resulting structured workout AND its SessionMatch atomically, so
 * the calendar bucketer collapses the activity↔workout pair into a
 * single matched card (per spa-coaching-integration). On any failure
 * the use case writes nothing — see design D3.
 *
 * How the Workout is built (the AI, or the steps table without it) is
 * chosen in one place, `chooseCoachingBuilder`, which also adds the
 * Athlete note to the coach's text.
 *
 * The LLM call is plumbed in as a port (`generateKrd`) so the use case
 * does not depend on the SPA's lib/generate-workout module; the dialog
 * wires the actual provider-aware implementation at the composition
 * root.
 *
 * Existing-workout shape (see
 * `convert-coaching-activity-with-ai-idempotency.ts` header for the
 * full contract):
 *   - existing workout, `state !== "raw"` → `ensureMatchForExisting`
 *     (no LLM call, auto-heal session_match if missing), unless the
 *     athlete asked to regenerate → `regenerateInPlace`.
 *   - existing workout, `state === "raw"` → `processExistingRawInPlace`
 *     (bill the LLM, transition raw → structured in place, preserve
 *     the existing session_match row).
 *   - no existing workout → `performAiCreation` (create new workout +
 *     session_match atomically).
 */
import { namespaceSourceId } from "../../types/coaching-activity-record";
import { chooseCoachingBuilder } from "./choose-coaching-builder";
import { readAthleteNoteText } from "./coaching-prompt-text";
import {
  performAiCreation,
  resolveCoachingSport,
} from "./convert-coaching-activity-with-ai-helpers";
import {
  ensureMatchForExisting,
  processExistingRawInPlace,
} from "./convert-coaching-activity-with-ai-idempotency";
import type {
  ConvertWithAiDeps,
  ConvertWithAiInput,
  ConvertWithAiResult,
} from "./convert-coaching-activity-with-ai-types";
import { regenerateInPlace } from "./regenerate-coaching-workout";

export type {
  ConvertWithAiDeps,
  ConvertWithAiInput,
  ConvertWithAiResult,
  GenerateKrdPort,
} from "./convert-coaching-activity-with-ai-types";

export const convertCoachingActivityWithAi = async (
  input: ConvertWithAiInput,
  deps: ConvertWithAiDeps
): Promise<ConvertWithAiResult> => {
  deps.analytics.event("coaching.convert_with_ai.invoked");
  const activity = await deps.coaching.getById(input.activityId);
  if (!activity) {
    deps.analytics.event("coaching.convert_with_ai.failure", {
      reason: "not-found",
    });
    return { ok: false, reason: "not-found" };
  }

  const nsSourceId = namespaceSourceId(activity.profileId, activity.sourceId);
  const existing = await deps.workouts.getBySourceId(
    activity.source,
    nsSourceId
  );
  if (existing && existing.state !== "raw" && !input.regenerate)
    return ensureMatchForExisting(deps, activity, existing);

  const note = await readAthleteNoteText(deps.athleteNotes, activity.id);
  const resolved = resolveCoachingSport(activity);
  const build = chooseCoachingBuilder(deps, activity, note, resolved);
  const signal = input.abortSignal;
  if (!existing)
    return performAiCreation(deps, activity, nsSourceId, build, signal);
  return existing.state === "raw"
    ? processExistingRawInPlace(deps, activity, existing, build, signal)
    : regenerateInPlace(deps, activity, existing, build, signal);
};
