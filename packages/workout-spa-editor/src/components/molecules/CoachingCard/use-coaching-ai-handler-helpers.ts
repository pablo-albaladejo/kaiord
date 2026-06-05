/**
 * Pure helper for `useCoachingAi.startAi` extracted to keep the hook
 * file under the per-file/per-function line caps. Owns the in-flight
 * lock check, provider lookup, use-case invocation, success-navigate,
 * and failure-toast dispatch. The toast call itself stays in the hook
 * so the R-PIIInterpolation guard finds the literal alongside its
 * caller; this helper only invokes the bound `onFailureToast` callback.
 */
import type { Analytics } from "@kaiord/core";
import type { MutableRefObject } from "react";

import type { AiFailureReason } from "../../../application/coaching/convert-coaching-activity-error-mapper";
import type { PersistencePort } from "../../../ports/persistence-port";
import { withOrigin } from "../../../routing/with-origin";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { pickProvider, runConvertWithAi } from "./use-coaching-ai-helpers";

type Reason = AiFailureReason | "not-found" | "no-provider";

export type StartAiCtx = {
  activity: CoachingActivity | null;
  profileId: string | null;
  providers: LlmProviderConfig[] | undefined;
  selectedProviderId: string | null;
  persistence: PersistencePort;
  analytics: Analytics;
  abortRef: MutableRefObject<AbortController | null>;
  setFailure: (f: { reason: Reason; error?: string } | null) => void;
  setProcessing: (v: boolean) => void;
  onClose: () => void;
  navigate: (to: string) => void;
  onFailureToast: () => void;
};

export const runStartAi = async (ctx: StartAiCtx): Promise<void> => {
  if (!ctx.activity || !ctx.profileId || ctx.abortRef.current) return;
  const provider = pickProvider(ctx.providers, ctx.selectedProviderId);
  if (!provider) {
    ctx.setFailure({ reason: "no-provider" });
    return;
  }
  ctx.setFailure(null);
  ctx.setProcessing(true);
  const controller = new AbortController();
  ctx.abortRef.current = controller;
  // The view-model `activity.id` is `${source}:${sourceId}`; the
  // persistence record id (what `coaching.getById` keys on) is the
  // composite `${profileId}:${source}:${sourceId}` — see
  // `buildCoachingActivityId`. Reconstruct here so the use case can
  // load the seeded row.
  let result: Awaited<ReturnType<typeof runConvertWithAi>>;
  try {
    result = await runConvertWithAi({
      activityId: `${ctx.profileId}:${ctx.activity.id}`,
      provider,
      abortSignal: controller.signal,
      persistence: ctx.persistence,
      analytics: ctx.analytics,
    });
  } catch (error) {
    if (ctx.abortRef.current === controller) {
      ctx.setFailure({
        reason: "ai-error",
        error: error instanceof Error ? error.message : String(error),
      });
      ctx.onFailureToast();
    }
    return;
  } finally {
    if (ctx.abortRef.current === controller) {
      ctx.abortRef.current = null;
      ctx.setProcessing(false);
    }
  }
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
