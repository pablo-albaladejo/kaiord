import { Upload } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSearch } from "wouter";

import { useAnalytics } from "../../../contexts/analytics-context";
import { useAppHandlers } from "../../../hooks/useAppHandlers";
import { FileUpload } from "../../molecules/FileUpload/FileUpload";
import { useImportOnLoad } from "./use-import-on-load";

/**
 * Centered overlay rendered when the editor mounts with
 * `?action=import`. Reuses `FileUpload` (which owns the parse pipeline
 * via `useFileUpload`) and auto-clicks its hidden `<input type="file">`
 * on mount so the OS file picker opens without a second user gesture.
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
  const date = new URLSearchParams(search).get("date");
  const onFileLoad = useImportOnLoad(date);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoClickedRef = useRef(false);

  useEffect(() => {
    if (autoClickedRef.current) return;
    autoClickedRef.current = true;
    const node = inputRef.current;
    if (!node) return;
    if (typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "center" });
    }
    node.focus();
    node.click();
  }, []);

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
          The file picker opens automatically. Cancel to retry.
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
