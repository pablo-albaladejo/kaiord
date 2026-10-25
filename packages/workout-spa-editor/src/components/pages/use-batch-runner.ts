import { useCallback, useRef, useState } from "react";

import type {
  BatchProgress,
  BatchResult,
} from "../../application/batch-processor";
import { processBatch } from "../../application/batch-processor";
import { usePersistence } from "../../contexts/persistence-context";
import { useTranslate } from "../../i18n/use-translate";
import { createProcessOne } from "./batch-process-one";
import type { BatchPending } from "./use-batch-state";

export function useBatchRunner(
  setMessage: (msg: string | null) => void,
  onSuccess?: (result: BatchResult) => void
) {
  const t = useTranslate("calendar");
  const persistence = usePersistence();
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
        const processOne = createProcessOne(
          batch.provider,
          batch.modelId,
          persistence
        );
        const result = await processBatch(
          batch.workouts,
          processOne,
          setProgress,
          controller.signal
        );
        // Success branch — fire onSuccess only when the await resolves
        // cleanly (cancellation throws AbortError → caught below → no
        // notification). Static-title toast lives in the caller to keep
        // this hook free of React-context coupling.
        onSuccess?.(result);
      } catch {
        setMessage(t("batch.error"));
      } finally {
        setIsProcessing(false);
      }
    },
    [setMessage, onSuccess, t, persistence]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsProcessing(false);
    setProgress(null);
  }, []);

  return { progress, isProcessing, run, cancel };
}
