/**
 * Batch processing state management for calendar page.
 */

import { useCallback, useRef, useState } from "react";

import type { BatchProgress } from "../../application/batch-processor";

export function useBatchState(rawCount: number) {
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    setIsProcessing(true);
    abortRef.current = new AbortController();
    setProgress({
      total: rawCount,
      processed: 0,
      succeeded: 0,
      failed: 0,
      current: null,
    });
  }, [rawCount]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsProcessing(false);
    setProgress(null);
  }, []);

  return { isProcessing, progress, start, cancel };
}
