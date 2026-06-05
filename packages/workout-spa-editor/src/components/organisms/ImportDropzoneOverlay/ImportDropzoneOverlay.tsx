import { Upload } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSearch } from "wouter";

import { useAnalytics } from "../../../contexts/analytics-context";
import { useAppHandlers } from "../../../hooks/useAppHandlers";
import { useWorkoutStore } from "../../../store/workout-store";
import { FileUpload } from "../../molecules/FileUpload/FileUpload";
import { useImportOnLoad } from "./use-import-on-load";

/**
 * Centered overlay rendered when the editor mounts with
 * `?action=import`. Reuses `FileUpload` (which owns the parse pipeline
 * via `useFileUpload`). The hidden `<input type="file">` is focused +
 * scrolled into view on mount, but the OS file picker is NOT opened
 * automatically — the user clicks the "Choose file" affordance or
 * drops a file onto the dropzone.
 *
 * When mounted with `?date=Y-M-D`, a successful import persists the
 * resulting KRD as a `WorkoutRecord` tagged with that date and routes
 * to `/workout/:id`. Header-entry imports (no `?date=`) keep the
 * non-persisting behaviour (load into store, let the user decide).
 */
export function ImportDropzoneOverlay() {
  const { handleFileError } = useAppHandlers();
  const analytics = useAnalytics();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const date = params.get("date");
  const from = params.get("from");
  const onFileLoad = useImportOnLoad(date, from);
  const clearWorkout = useWorkoutStore((s) => s.clearWorkout);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mountInitializedRef = useRef(false);

  useEffect(() => {
    if (mountInitializedRef.current) return;
    mountInitializedRef.current = true;
    // Discard any workout left in the store from a prior route (scratch
    // draft, template preview, etc.) so `EditorPage`'s `importComplete`
    // branch — `mode === "import" && currentWorkout !== null` — does not
    // fire on the stale value and skip rendering this overlay.
    clearWorkout();
    const node = inputRef.current;
    if (!node) return;
    if (typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "center" });
    }
    node.focus();
  }, [clearWorkout]);

  const handleImported = (format: string) => {
    analytics.event("workout-imported", { format });
  };

  return (
    <div
      data-testid="import-dropzone-overlay"
      className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <Upload className="h-8 w-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Drop a FIT, TCX, ZWO, GCN, or KRD file
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Or click below to choose one from your device.
        </p>
        <FileUpload
          onFileLoad={onFileLoad}
          onError={handleFileError}
          onImported={handleImported}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}
