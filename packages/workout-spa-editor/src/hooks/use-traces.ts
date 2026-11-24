/**
 * The athlete's Traces, live, with the two things they can do with all of
 * them: save every one as a JSON file, and delete every one. Reads and
 * writes go through the persistence port; nothing here sends anything.
 */
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";

import { exportTraces } from "../application/trace/export-traces";
import { usePersistence } from "../contexts/persistence-context";
import type { TraceRecord } from "../types/trace-schemas";
import { triggerDownload } from "../utils/save-workout.helpers";

export type UseTraces = {
  traces: TraceRecord[] | undefined;
  exportAll: () => Promise<void>;
  deleteAll: () => Promise<void>;
};

export const useTraces = (): UseTraces => {
  const persistence = usePersistence();
  const traces = useLiveQuery(() => persistence.traces.list(), [persistence]);
  const exportAll = useCallback(async () => {
    const file = await exportTraces(persistence.traces);
    triggerDownload(file.text, file.filename);
  }, [persistence]);
  const deleteAll = useCallback(
    () => persistence.traces.clear(),
    [persistence]
  );
  return { traces, exportAll, deleteAll };
};
