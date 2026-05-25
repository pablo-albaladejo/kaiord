/**
 * WellnessEntryForm — four ephemeral number fields (weight / sleep score
 * / HRV / steps) and ONE Save button. On submit it collects every FILLED
 * field into a `{metric → number}` set and hands the whole set to a
 * single `submit(values)` call (NOT one save per field). Empty/blank
 * fields are excluded; an all-empty submit is a no-op.
 */
import { useState } from "react";

import type { ManualHealthMetric } from "../../../application/health/manual-health-metric";
import { useSaveWellness, type WellnessValues } from "./use-save-wellness";
import { WellnessMetricField } from "./WellnessMetricField";

export type WellnessEntryFormProps = {
  date: string;
  onSaved: () => void;
};

type Fields = Record<ManualHealthMetric, string>;

const EMPTY_FIELDS: Fields = { weight: "", sleep: "", hrv: "", steps: "" };

const collectFilled = (fields: Fields): WellnessValues => {
  const values: WellnessValues = {};
  for (const [metric, raw] of Object.entries(fields)) {
    if (raw.trim() === "") continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) values[metric as ManualHealthMetric] = parsed;
  }
  return values;
};

export function WellnessEntryForm({ date, onSaved }: WellnessEntryFormProps) {
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const { submit, isSaving } = useSaveWellness(date);

  const setField = (metric: ManualHealthMetric) => (value: string) =>
    setFields((prev) => ({ ...prev, [metric]: value }));

  const handleSubmit = async () => {
    const values = collectFilled(fields);
    if (Object.keys(values).length === 0) return;
    const ok = await submit(values);
    if (ok) onSaved();
  };

  return (
    <div className="flex flex-col gap-3">
      <WellnessMetricField
        label="Weight"
        unit="kg"
        value={fields.weight}
        onChange={setField("weight")}
        min={0.1}
        step={0.1}
      />
      <WellnessMetricField
        label="Sleep score"
        value={fields.sleep}
        onChange={setField("sleep")}
        min={0}
        max={100}
        step={1}
      />
      <WellnessMetricField
        label="HRV"
        unit="ms"
        value={fields.hrv}
        onChange={setField("hrv")}
        min={0.1}
        step={0.1}
      />
      <WellnessMetricField
        label="Steps"
        value={fields.steps}
        onChange={setField("steps")}
        min={0}
        step={1}
      />
      <button
        type="button"
        disabled={isSaving}
        onClick={handleSubmit}
        className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}
