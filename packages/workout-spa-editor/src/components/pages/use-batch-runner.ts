/**
 * Encapsulates the actual dispatch of a staged batch: processing
 * state, progress updates, and cancellation. Extracted from
 * `useBatchState` to keep each hook under the max-lines-per-function
 * rule.
 */

import { useCallback, useRef, useState } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import type { BatchProgress } from "../../application/batch-processor";
import { processBatch } from "../../application/batch-processor";
import { createProcessOne } from "./batch-process-one";
import type { BatchPending } from "./use-batch-state";

export function useBatchRunner(setMessage: (msg: string | null) => void) {
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (batch: BatchPending) => {
      setMessage(null);
      setIsProcessing(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const processOne = createProcessOne(batch.provider, db);
        await processBatch(
          batch.workouts,
          processOne,
          setProgress,
          controller.signal
        );
      } catch {
        setMessage("Batch processing encountered an unexpected error.");
      } finally {
        setIsProcessing(false);
      }
    },
    [setMessage]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsProcessing(false);
    setProgress(null);
  }, []);

  return { progress, isProcessing, run, cancel };
}
