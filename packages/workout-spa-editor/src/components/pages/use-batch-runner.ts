import { useCallback, useRef, useState } from "react";

import type {
  BatchProgress,
  BatchResult,
} from "../../application/batch-processor";
import { processBatch } from "../../application/batch-processor";
import { startTraceRun } from "../../application/trace/trace-run";
import { usePersistence } from "../../contexts/persistence-context";
import { useGenerationDeps } from "../../hooks/use-generation-deps";
import { useTranslate } from "../../i18n/use-translate";
import { useUnsavedWork } from "../../lib/use-unsaved-work";
import { createProcessOne } from "./batch-process-one";
import type { BatchPending } from "./use-batch-state";

// A batch failed when nothing in it went through; a partial batch is a run
// that finished, its failed attempts listed in the Trace's cost.
const batchOutcome = (result: BatchResult) => {
  if (result.cancelled) return "stopped" as const;
  const through = result.succeeded.length + result.skipped.length;
  return through === 0 && result.failed.length > 0 ? "failed" : "ok";
};

export function useBatchRunner(
  setMessage: (msg: string | null) => void,
  onSuccess?: (result: BatchResult) => void
) {
  const t = useTranslate("calendar");
  const persistence = usePersistence();
  const deps = useGenerationDeps();
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  useUnsavedWork(isProcessing);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (batch: BatchPending) => {
      setMessage(null);
      setIsProcessing(true);
      const controller = new AbortController();
      abortRef.current = controller;
      const trace = startTraceRun({
        feature: "batch",
        traces: persistence.traces,
      });
      try {
        const processOne = createProcessOne(
          batch.provider,
          batch.modelId,
          persistence,
          { deps, trace, signal: controller.signal }
        );
        const result = await processBatch(
          batch.workouts,
          processOne,
          setProgress,
          controller.signal
        );
        await trace.finish(batchOutcome(result));
        // Success branch — fire onSuccess only when the await resolves
        // cleanly (cancellation throws AbortError → caught below → no
        // notification). Static-title toast lives in the caller to keep
        // this hook free of React-context coupling.
        onSuccess?.(result);
      } catch {
        await trace.finish("failed");
        setMessage(t("batch.error"));
      } finally {
        setIsProcessing(false);
      }
    },
    [setMessage, onSuccess, t, persistence, deps]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsProcessing(false);
    setProgress(null);
  }, []);

  return { progress, isProcessing, run, cancel };
}
