/**
 * LabImportSection — entry-tab affordance to extract a lab report from an
 * uploaded PDF/image. Disabled with a hint when no lab-extraction model is
 * configured; shows a cancelable progress state while extracting and hands the
 * resulting draft to the form via `onDraft`.
 */
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import type { LabDraft } from "./map-extraction-to-draft";
import { useLabImport } from "./use-lab-import";

export type LabImportSectionProps = {
  onDraft: (draft: LabDraft) => void;
};

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

export function LabImportSection({ onDraft }: LabImportSectionProps) {
  const { t } = useTranslation("labImport");
  const { canImport, isRunning, run, cancel } = useLabImport(onDraft);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void run(file);
  };

  return (
    <section
      className="flex flex-col gap-2 rounded border border-gray-200 p-3 dark:border-slate-800"
      data-testid="lab-import-section"
    >
      <p className="text-sm font-medium">{t("title")}</p>
      {!canImport && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("noProviderHint")}
        </p>
      )}
      {canImport && isRunning && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("progress")}
          </span>
          <button
            type="button"
            onClick={cancel}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            {t("cancel")}
          </button>
        </div>
      )}
      {canImport && !isRunning && (
        <label className="flex flex-col gap-1 text-sm">
          {t("affordance")}
          <input
            type="file"
            accept={ACCEPT}
            aria-label={t("affordance")}
            onChange={onChange}
            className="text-sm"
          />
        </label>
      )}
    </section>
  );
}
