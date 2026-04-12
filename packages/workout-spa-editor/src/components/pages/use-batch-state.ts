/**
 * Batch processing state management for calendar page.
 *
 * Shows a "configure AI provider" message when no provider
 * is configured, since batch processing requires AI.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useRef, useState } from "react";

import { createDexieAiProviderRepository } from "../../adapters/dexie/dexie-ai-provider-repository";
import { db } from "../../adapters/dexie/dexie-database";
import type { BatchProgress } from "../../application/batch-processor";
import { processBatch } from "../../application/batch-processor";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";
import { createProcessOne } from "./batch-process-one";

type BatchPrep =
  | { ok: true; provider: LlmProviderConfig; workouts: WorkoutRecord[] }
  | { ok: false; message: string };

async function prepareBatch(
  weekStart: string,
  weekEnd: string
): Promise<BatchPrep> {
  const repo = createDexieAiProviderRepository(db);
  const providers = await repo.getAll();
  const provider = providers.find((p) => p.isDefault) ?? providers[0];
  if (!provider) {
    return { ok: false, message: "Configure an AI provider in Settings." };
  }

  const workouts = await db
    .table<WorkoutRecord>("workouts")
    .where("date")
    .between(weekStart, weekEnd, true, true)
    .filter((w) => w.state === "raw")
    .toArray();

  if (workouts.length === 0) {
    return { ok: false, message: "No raw workouts to process this week." };
  }

  return { ok: true, provider, workouts };
}

export function useBatchState(weekStart: string, weekEnd: string) {
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const providerCount = useLiveQuery(() => db.table("aiProviders").count(), []);

  const start = useCallback(async () => {
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
    setIsProcessing(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const processOne = createProcessOne(prep.provider, db);
      await processBatch(
        prep.workouts,
        processOne,
        setProgress,
        controller.signal
      );
    } catch {
      setMessage("Batch processing encountered an unexpected error.");
    } finally {
      setIsProcessing(false);
    }
  }, [weekStart, weekEnd, providerCount]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsProcessing(false);
    setProgress(null);
  }, []);

  const dismissMessage = useCallback(() => setMessage(null), []);

  return { isProcessing, progress, message, start, cancel, dismissMessage };
}
