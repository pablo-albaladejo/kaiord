import { Download } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { KRD } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { Button } from "../../atoms/Button/Button";
import { ExportFormatSelector } from "../../molecules/ExportFormatSelector/ExportFormatSelector";
import { SaveButtonToasts } from "../../molecules/SaveButton/SaveButtonToasts";
import { useSaveWorkout } from "../../molecules/SaveButton/use-save-workout";

type ConvertExportProps = { workout: KRD; format: WorkoutFileFormat };

/**
 * The editor's export pipeline (`useSaveWorkout`, which also emits
 * `workout-exported`) with the deep link's target format preselected.
 */
export function ConvertExport({ workout, format }: ConvertExportProps) {
  const verbs = useTranslate("common");
  const t = useTranslate("editor");
  const save = useSaveWorkout(workout, format);
  const { toasts, dismiss } = save.toast;

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <ExportFormatSelector
        currentFormat={save.selectedFormat}
        onFormatChange={save.setSelectedFormat}
        workout={workout}
        disabled={save.isSaving}
        className="w-full sm:w-auto"
      />
      <Button
        variant="primary"
        size="sm"
        onClick={save.handleSave}
        disabled={save.isSaving}
        className="w-full sm:w-auto"
        data-testid="convert-download"
      >
        <Download className="h-4 w-4" />
        {save.isSaving ? t("save.saving") : verbs("verbs.download")}
      </Button>
      <SaveButtonToasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
