/**
 * SaveButton Component
 *
 * The editor's one download control: it opens the format menu, and picking
 * a format downloads the workout in it.
 *
 * Requirements:
 * - Requirement 6: Save workout as KRD file
 * - Requirement 12.6: Provide format selection options (FIT, TCX, ZWO, KRD)
 * - Requirement 12.10: Generate correct file extension based on format
 * - Requirement 36: Clear error feedback with retry options
 */

import { Download } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { KRD } from "../../../types/krd";
import { ExportFormatSelector } from "../ExportFormatSelector/ExportFormatSelector";
import { SaveErrorDialog } from "../SaveErrorDialog/SaveErrorDialog";
import { ProgressBar } from "./ProgressBar";
import { SaveButtonToasts } from "./SaveButtonToasts";
import { useSaveWorkout } from "./use-save-workout";

export type SaveButtonProps = {
  workout: KRD;
  /** The profile owning the persisted record, if any (see `resolveExportProfile`). */
  ownerProfileId?: string;
  disabled?: boolean;
  className?: string;
};

export function SaveButton({
  workout,
  ownerProfileId,
  disabled,
  className,
}: SaveButtonProps) {
  const t = useTranslate("editor");
  // The verb itself lives in `common` — this button is one of three call
  // sites for it, and they must not be allowed to drift apart again.
  const verbs = useTranslate("common");
  const {
    saveErrors,
    isSaving,
    exportProgress,
    downloadAs,
    clearErrors,
    selectedFormat,
    toast: { toasts, dismiss },
  } = useSaveWorkout(workout, ownerProfileId);
  const isDisabled = disabled || isSaving;
  const showProgress = isSaving && exportProgress > 0 && exportProgress < 100;
  const icon = isSaving ? (
    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
  ) : (
    <Download className="h-4 w-4" />
  );

  return (
    <div
      className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}
    >
      <ExportFormatSelector
        currentFormat={selectedFormat}
        onFormatChange={(format) => void downloadAs(format)}
        workout={workout}
        disabled={isDisabled}
        className="w-full sm:w-auto"
        label={
          <span className="flex items-center gap-2">
            {icon}
            {isSaving ? t("save.saving") : verbs("verbs.download")}
          </span>
        }
      />

      {showProgress && <ProgressBar progress={exportProgress} />}

      {saveErrors && saveErrors.length > 0 && (
        <SaveErrorDialog
          errors={saveErrors}
          onClose={clearErrors}
          onRetry={clearErrors}
        />
      )}
      <SaveButtonToasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
