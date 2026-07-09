/**
 * LabParameterMeasurementFields — value + unit (with a live conversion
 * preview when a known non-canonical unit is entered) and the report's
 * reference low/high (auto-filled from the catalog, editable).
 */
import {
  convertMeasurement,
  getLabParameter,
  isCustomParameterKey,
} from "@kaiord/core";
import { useId } from "react";

import { useTranslate } from "../../../../i18n/use-translate";
import { unitOptionsFor } from "./lab-parameter-options";
import {
  type LabRowState,
  setRefHighRaw,
  setRefLowRaw,
  setUnitRaw,
  setValueRaw,
} from "./lab-row-model";

const FIELD_CLASS =
  "w-24 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

type FieldsProps = {
  row: LabRowState;
  onChange: (next: LabRowState) => void;
};

function ValueUnitFields({ row, onChange }: FieldsProps) {
  const t = useTranslate("labs-ui");
  const unitListId = useId();
  const param = isCustomParameterKey(row.parameterKey)
    ? undefined
    : getLabParameter(row.parameterKey);
  const parsedValue = Number(row.valueRaw);
  const preview =
    param && row.unitRaw.trim() !== "" && Number.isFinite(parsedValue)
      ? convertMeasurement(param, parsedValue, row.unitRaw)
      : undefined;
  const showPreview = preview && preview.unitCanonical !== row.unitRaw;

  return (
    <>
      <label className="flex flex-col gap-1 text-xs">
        {t("form.value")}
        <input
          type="number"
          step="any"
          aria-label={t("form.value")}
          value={row.valueRaw}
          className={FIELD_CLASS}
          onChange={(e) => onChange(setValueRaw(row, e.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        {t("form.unit")}
        <input
          list={param ? unitListId : undefined}
          aria-label={t("form.unit")}
          value={row.unitRaw}
          className={FIELD_CLASS}
          onChange={(e) => onChange(setUnitRaw(row, e.target.value))}
        />
      </label>
      {param && (
        <datalist id={unitListId}>
          {unitOptionsFor(param).map((unit) => (
            <option key={unit} value={unit} />
          ))}
        </datalist>
      )}
      {showPreview && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          ≈ {preview.valueCanonical.toFixed(2)} {preview.unitCanonical}
        </span>
      )}
    </>
  );
}

export function LabParameterMeasurementFields({ row, onChange }: FieldsProps) {
  const t = useTranslate("labs-ui");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <ValueUnitFields row={row} onChange={onChange} />
      <label className="flex flex-col gap-1 text-xs">
        {t("form.refLow")}
        <input
          type="number"
          step="any"
          aria-label={t("form.referenceLow")}
          value={row.refLowRaw}
          className={FIELD_CLASS}
          onChange={(e) => onChange(setRefLowRaw(row, e.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        {t("form.refHigh")}
        <input
          type="number"
          step="any"
          aria-label={t("form.referenceHigh")}
          value={row.refHighRaw}
          className={FIELD_CLASS}
          onChange={(e) => onChange(setRefHighRaw(row, e.target.value))}
        />
      </label>
    </div>
  );
}
