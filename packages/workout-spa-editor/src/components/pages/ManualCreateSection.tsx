import { ChevronDown, Plus, Upload } from "lucide-react";
import { type RefObject, useState } from "react";

import { useAnalytics } from "../../contexts";
import type { KRD, ValidationError } from "../../types/krd";
import { Button } from "../atoms/Button/Button";
import { Card } from "../atoms/Card/Card";
import { FileUpload } from "../molecules/FileUpload/FileUpload";

type ManualCreateSectionProps = {
  onCreateClick: () => void;
  onFileLoad: (krd: KRD) => void;
  onFileError: (
    error: string,
    validationErrors?: Array<ValidationError>
  ) => void;
  /**
   * Optional ref to the underlying file input, forwarded down so the
   * editor's import mode can focus it on mount.
   */
  fileInputRef?: RefObject<HTMLInputElement | null>;
  /**
   * Whether the upload section starts expanded. Defaults to false; the
   * editor's import mode sets this true so the file input is visible.
   */
  defaultExpanded?: boolean;
};

export function ManualCreateSection({
  onCreateClick,
  onFileLoad,
  onFileError,
  fileInputRef,
  defaultExpanded = false,
}: ManualCreateSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const analytics = useAnalytics();

  const handleImported = (format: string) => {
    analytics.event("workout-imported", { format });
  };

  return (
    <Card>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Or create manually / import a file
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-700">
          <Button
            onClick={onCreateClick}
            variant="secondary"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Empty Workout
          </Button>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Upload className="h-3 w-3" />
            <span>Or upload a FIT, TCX, ZWO, GCN, or KRD file:</span>
          </div>
          <FileUpload
            onFileLoad={onFileLoad}
            onError={onFileError}
            onImported={handleImported}
            inputRef={fileInputRef}
          />
        </div>
      )}
    </Card>
  );
}
