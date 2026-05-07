/**
 * convertCoachingActivityWithAi — application use case.
 *
 * Synchronously runs the AI pipeline (LLM → KRD) and persists the
 * resulting structured workout AND its SessionMatch atomically, so
 * the calendar bucketer collapses the activity↔workout pair into a
 * single matched card (per spa-coaching-integration). On any failure
 * the use case writes nothing — see design D3.
 *
 * The LLM call is plumbed in as a port (`generateKrd`) so the use case
 * does not depend on the SPA's lib/generate-workout module; the dialog
 * wires the actual provider-aware implementation at the composition
 * root.
 */
import { namespaceSourceId } from "../../types/coaching-activity-record";
import {
  performAiCreation,
  resolvePromptText,
} from "./convert-coaching-activity-with-ai-helpers";
import { ensureMatchForExisting } from "./convert-coaching-activity-with-ai-idempotency";
import type {
  ConvertWithAiDeps,
  ConvertWithAiInput,
  ConvertWithAiResult,
} from "./convert-coaching-activity-with-ai-types";

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
  if (existing) return ensureMatchForExisting(deps, activity, existing.id);

  const text = resolvePromptText(activity);
  return performAiCreation(deps, activity, nsSourceId, text, input.abortSignal);
};
