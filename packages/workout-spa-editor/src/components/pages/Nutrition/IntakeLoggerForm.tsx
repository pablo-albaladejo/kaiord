import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import {
  EMPTY_INTAKE_FIELDS,
  type IntakeLoggerFields as Fields,
  validateIntakeForm,
} from "./intake-logger-model";
import { IntakeLoggerFields } from "./IntakeLoggerFields";
import type { UseIntakeActionsResult } from "./use-intake-actions";

export type IntakeLoggerFormProps = {
  date: string;
  actions: Pick<UseIntakeActionsResult, "logEntry" | "savePreset">;
};

/**
 * Quick intake logger: validates the fields, logs an entry for the date, and
 * (when a label is present) optionally saves the same values as a preset.
 */
export function IntakeLoggerForm({ date, actions }: IntakeLoggerFormProps) {
  const t = useTranslate("nutrition");
  const [fields, setFields] = useState<Fields>(EMPTY_INTAKE_FIELDS);
  const result = validateIntakeForm(fields, t);
  const error = "error" in result ? result.error : null;

  const handleLog = async () => {
    if (!("entry" in result)) return;
    if (await actions.logEntry(date, result.entry)) {
      setFields(EMPTY_INTAKE_FIELDS);
    }
  };

  const handleSavePreset = async () => {
    if (!("entry" in result) || fields.label.trim() === "") return;
    if (await actions.savePreset(result.entry, fields.label.trim())) {
      setFields(EMPTY_INTAKE_FIELDS);
    }
  };

  return (
    <Card
      className="border-slate-800 bg-primary-900 p-4"
      data-testid="intake-logger"
    >
      <p className="m-0 mb-3 text-[15px] font-semibold text-slate-100">
        {t("logger.title")}
      </p>
      <IntakeLoggerFields fields={fields} onChange={setFields} />
      {error !== null && (
        <p role="alert" className="m-0 mt-2 text-[12px] text-red-400">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!("entry" in result)}
          onClick={handleLog}
          data-testid="intake-log-submit"
          className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t("logger.addEntry")}
        </button>
        <button
          type="button"
          disabled={!("entry" in result) || fields.label.trim() === ""}
          onClick={handleSavePreset}
          data-testid="intake-save-preset"
          className="rounded border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-40"
        >
          {t("logger.savePreset")}
        </button>
      </div>
    </Card>
  );
}
