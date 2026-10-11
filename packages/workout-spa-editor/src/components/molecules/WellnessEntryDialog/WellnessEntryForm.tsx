/**
 * WellnessEntryForm — weight, sleep (hours, score, bedtime/wake time), HRV
 * and steps, with ONE Save button. On submit every FILLED field is collected
 * and handed to a single `submit(values)` call (NOT one save per field).
 * Blank fields are excluded; an all-blank submit is a no-op.
 */
import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { collectWellness } from "./collect-wellness";
import type { SleepFieldsError } from "./sleep-entry-fields";
import { useSaveWellness } from "./use-save-wellness";
import { useWellnessFields } from "./use-wellness-fields";
import { WellnessMetricField } from "./WellnessMetricField";
import { WellnessSleepFields } from "./WellnessSleepFields";

export type WellnessEntryFormProps = {
  date: string;
  onSaved: () => void;
};

export function WellnessEntryForm({ date, onSaved }: WellnessEntryFormProps) {
  const t = useTranslate("health");
  const { fields, setField, setSleepField } = useWellnessFields();
  const [error, setError] = useState<SleepFieldsError | null>(null);
  const { submit, isSaving } = useSaveWellness(date);

  const handleSubmit = async () => {
    const collected = collectWellness(fields, date);
    setError("error" in collected ? collected.error : null);
    if ("error" in collected) return;
    if (Object.keys(collected.values).length === 0) return;
    if (await submit(collected.values)) onSaved();
  };

  return (
    <div className="flex flex-col gap-3">
      <WellnessMetricField
        label={t("wellnessEntry.weight")}
        unit="kg"
        focusKey="weight"
        value={fields.weight}
        onChange={setField("weight")}
        min={0.1}
        step={0.1}
      />
      <WellnessSleepFields fields={fields.sleep} onChange={setSleepField} />
      <WellnessMetricField
        label={t("wellnessEntry.hrv")}
        unit="ms"
        focusKey="hrv"
        value={fields.hrv}
        onChange={setField("hrv")}
        min={0.1}
        step={0.1}
      />
      <WellnessMetricField
        label={t("wellnessEntry.steps")}
        focusKey="daily-wellness"
        value={fields.steps}
        onChange={setField("steps")}
        min={0}
        step={1}
      />
      {error && (
        <p role="alert" className="m-0 text-sm text-danger-text">
          {t(`wellnessEntry.error.${error}`)}
        </p>
      )}
      <button
        type="button"
        disabled={isSaving}
        onClick={handleSubmit}
        className="mt-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {t("wellnessEntry.save")}
      </button>
    </div>
  );
}
