import { ChevronDown, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "../atoms/Button/Button";
import { FileUpload } from "../molecules/FileUpload/FileUpload";
import type { KRD, ValidationError } from "../../types/krd";

type ManualCreateSectionProps = {
  onCreateClick: () => void;
  onFileLoad: (krd: KRD) => void;
  onFileError: (
    error: string,
    validationErrors?: Array<ValidationError>
  ) => void;
};

export function ManualCreateSection({
  onCreateClick,
  onFileLoad,
  onFileError,
}: ManualCreateSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
          <FileUpload onFileLoad={onFileLoad} onError={onFileError} />
        </div>
      )}
    </div>
  );
}
