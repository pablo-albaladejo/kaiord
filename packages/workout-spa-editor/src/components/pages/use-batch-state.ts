/**
 * Batch processing state management for calendar page.
 *
 * Two-phase start: `requestStart` stages `pending` (provider +
 * workouts) so a confirmation dialog can render estimated tokens/cost
 * before the user commits; `confirmStart` dispatches the actual run
 * (delegated to `useBatchRunner`).
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useState } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";
import { prepareBatch } from "./batch-prepare";
import { useBatchRunner } from "./use-batch-runner";

export type BatchPending = {
  provider: LlmProviderConfig;
  workouts: WorkoutRecord[];
};

export function useBatchState(weekStart: string, weekEnd: string) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<BatchPending | null>(null);
  const runner = useBatchRunner(setMessage);

  const providerCount = useLiveQuery(() => db.table("aiProviders").count(), []);

  const requestStart = useCallback(async () => {
    if (!providerCount || providerCount === 0) {
      setMessage("Configure an AI provider in Settings to process workouts.");
      return;
    }
    const prep = await prepareBatch(weekStart, weekEnd);
    if (!prep.ok) {
      setMessage(prep.message);
      return;
    }
    setMessage(null);
    setPending({ provider: prep.provider, workouts: prep.workouts });
  }, [weekStart, weekEnd, providerCount]);

  const confirmStart = useCallback(async () => {
    const staged = pending;
    if (!staged) return;
    setPending(null);
    await runner.run(staged);
  }, [pending, runner]);

  const cancelRequest = useCallback(() => setPending(null), []);
  const dismissMessage = useCallback(() => setMessage(null), []);

  return {
    isProcessing: runner.isProcessing,
    progress: runner.progress,
    message,
    pending,
    requestStart,
    confirmStart,
    cancelRequest,
    cancel: runner.cancel,
    dismissMessage,
  };
}
