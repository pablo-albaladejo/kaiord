/**
 * Pure helper for `useCoachingAi.startAi` extracted to keep the hook
 * file under the per-file/per-function line caps. Owns the in-flight
 * lock check, provider lookup, use-case invocation, success-navigate,
 * and failure-toast dispatch. The toast call itself stays in the hook
 * so the R-PIIInterpolation guard finds the literal alongside its
 * caller; this helper only invokes the bound `onFailureToast` callback.
 */
import { resolveModelForPurpose } from "@kaiord/ai/providers";

import { classifyAiFailure } from "../../../application/coaching/convert-coaching-activity-error-mapper";
import { withOrigin } from "../../../routing/with-origin";
import { beginAiRun, endAiRun } from "./ai-run-progress";
import type { StartAiCtx } from "./start-ai-ctx";
import { runConvertWithAi } from "./use-coaching-ai-helpers";

export const runStartAi = async (ctx: StartAiCtx): Promise<void> => {
  if (!ctx.activity || !ctx.profileId || ctx.abortRef.current) return;
  // Prefetch the coach description before convert reads the activity (weekly
  // sync carries none) so it becomes the workout-level note. `expandDay`
  // resolves a result (never rejects), so awaiting is safe and closes the
  // race with the fire-and-forget on-open expand.
  if (ctx.activity.description === undefined) {
    await ctx.expandActivity(ctx.activity);
  }
  const resolved = resolveModelForPurpose(
    "workout_generation",
    ctx.providers ?? [],
    ctx.bindings ?? []
  );
  if (!resolved) return ctx.setFailure({ reason: "no-provider" });
  ctx.setFailure(null);
  const { controller, onProgress } = beginAiRun(
    ctx,
    ctx.nameModel(resolved.provider.type, resolved.modelId)
  );
  // The view-model `activity.id` is `${source}:${sourceId}`; the
  // persistence record id (what `coaching.getById` keys on) is the
  // composite `${profileId}:${source}:${sourceId}` — see
  // `buildCoachingActivityId`. Reconstruct here so the use case can
  // load the seeded row.
  let result: Awaited<ReturnType<typeof runConvertWithAi>>;
  try {
    result = await runConvertWithAi({
      activityId: `${ctx.profileId}:${ctx.activity.id}`,
      provider: resolved.provider,
      modelId: resolved.modelId,
      abortSignal: controller.signal,
      regenerate: ctx.regenerate,
      onProgress,
      deps: ctx.deps,
      analytics: ctx.analytics,
    });
  } catch (error) {
    if (ctx.abortRef.current === controller) {
      ctx.setFailure({
        reason: classifyAiFailure(error),
        error: error instanceof Error ? error.message : String(error),
      });
      ctx.onFailureToast();
    }
    return;
  } finally {
    endAiRun(ctx, controller);
  }
  // A cancel that lands after the run settled must not navigate away.
  if (controller.signal.aborted) return;
  if (result.ok) {
    ctx.onClose();
    ctx.navigate(withOrigin(`/workout/${result.workoutId}`, "coaching"));
    return;
  }
  if (result.reason !== "ai-cancelled") {
    ctx.setFailure({ reason: result.reason, error: result.error });
    ctx.onFailureToast();
  }
};
