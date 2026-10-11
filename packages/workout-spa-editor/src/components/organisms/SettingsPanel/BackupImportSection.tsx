import { type ChangeEvent, useRef } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { BackupProfileChoice } from "./BackupProfileChoice";
import { type ImportProblem, useImportBackup } from "./use-import-backup";

const PROBLEM_KEYS: Record<ImportProblem, string> = {
  invalid: "privacy.importInvalid",
  unsupportedVersion: "privacy.importNewerApp",
  newerApp: "privacy.importNewerApp",
  failed: "privacy.importFailed",
};

export const BackupImportSection: React.FC = () => {
  const t = useTranslate("settings");
  const input = useRef<HTMLInputElement>(null);
  const { state, importFile, choose, cancel } = useImportBackup();

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void importFile(file);
  };

  return (
    <div className="mb-4">
      <Button
        variant="secondary"
        size="sm"
        disabled={state.kind === "busy"}
        onClick={() => input.current?.click()}
      >
        {t("privacy.importData")}
      </Button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        aria-label={t("privacy.importFileLabel")}
        className="sr-only"
        tabIndex={-1}
        onChange={onFile}
      />
      <p className="mt-2 text-xs text-ink-muted">{t("privacy.importHint")}</p>
      {state.kind === "choose" && (
        <BackupProfileChoice
          candidates={state.candidates}
          onChoose={choose}
          onCancel={cancel}
        />
      )}
      {state.kind === "done" && (
        <div role="status" className="mt-2 space-y-1 text-sm text-ink-body">
          <p>
            {t("privacy.importSummary", {
              added: state.summary.added,
              updated: state.summary.updated,
              notRestored: state.summary.notRestored,
            })}
          </p>
          {state.summary.nutritionMayReappear && (
            <p className="text-xs text-ink-muted">
              {t("privacy.importNutritionWarning")}
            </p>
          )}
        </div>
      )}
      {state.kind === "error" && (
        <p role="alert" className="mt-2 text-sm text-danger-text">
          {t(PROBLEM_KEYS[state.problem])}
        </p>
      )}
    </div>
  );
};
