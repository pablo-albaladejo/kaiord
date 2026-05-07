/**
 * AI-process handler for the coaching dialog (per design D2/D3).
 *
 * Synchronous: while in flight, the dialog body switches to a spinner
 * with a Cancel button. On success the use case persists a structured
 * workout AND its session_match (per D1) and the handler navigates
 * to the workout editor. On failure the handler surfaces a typed
 * reason so the dialog renders the inline error state.
 *
 * Re-entrancy: the in-flight `AbortController` doubles as the lock —
 * a second `startAi` call while one is pending is a silent no-op.
 *
 * NOTE: AbortController is plumbed through to the use case but the
 * underlying `generateWorkoutKrd` does not yet propagate the signal to
 * the LLM transport — cancel today means "abandon the result", not
 * "cancel the network request".
 */
import { useCallback, useRef, useState } from "react";
import { useLocation } from "wouter";

import type { AiFailureReason } from "../../../application/coaching/convert-coaching-activity-error-mapper";
import { useAnalytics } from "../../../contexts/analytics-context";
import { usePersistence } from "../../../contexts/persistence-context";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { pickProvider, runConvertWithAi } from "./use-coaching-ai-helpers";

export type AiFailureState = {
  reason: AiFailureReason | "not-found" | "no-provider";
  error?: string;
};

export type UseCoachingAi = {
  processing: boolean;
  failure: AiFailureState | null;
  clearFailure: () => void;
  startAi: () => Promise<void>;
  cancelAi: () => void;
};

export const useCoachingAi = (
  activity: CoachingActivity | null,
  profileId: string | null,
  onClose: () => void
): UseCoachingAi => {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const providers = useAiProvidersLive();
  const selectedProviderId = useAiRuntimeStore((s) => s.selectedProviderId);
  const [, navigate] = useLocation();
  const [processing, setProcessing] = useState(false);
  const [failure, setFailure] = useState<AiFailureState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startAi = useCallback(async () => {
    if (!activity || !profileId || abortRef.current) return;
    const provider = pickProvider(providers, selectedProviderId);
    if (!provider) return setFailure({ reason: "no-provider" });
    setFailure(null);
    setProcessing(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    // The view-model `activity.id` is `${source}:${sourceId}`; the
    // persistence record id (what `coaching.getById` keys on) is the
    // composite `${profileId}:${source}:${sourceId}` — see
    // `buildCoachingActivityId`. Reconstruct here so the use case can
    // load the seeded row.
    const result = await runConvertWithAi({
      activityId: `${profileId}:${activity.id}`,
      provider,
      abortSignal: ctrl.signal,
      persistence,
      analytics,
    });
    abortRef.current = null;
    setProcessing(false);
    if (result.ok) {
      onClose();
      navigate(`/workout/${result.workoutId}`);
      return;
    }
    if (result.reason !== "ai-cancelled")
      setFailure({ reason: result.reason, error: result.error });
  }, [
    activity,
    profileId,
    providers,
    selectedProviderId,
    persistence,
    analytics,
    onClose,
    navigate,
  ]);

  return {
    processing,
    failure,
    clearFailure: useCallback(() => setFailure(null), []),
    startAi,
    cancelAi: useCallback(() => {
      abortRef.current?.abort();
      abortRef.current = null;
      setProcessing(false);
    }, []),
  };
};
