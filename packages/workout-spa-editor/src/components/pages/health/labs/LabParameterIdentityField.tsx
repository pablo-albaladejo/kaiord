/**
 * LabParameterIdentityField — mode toggle (catalog / custom) plus the
 * matching input: a catalog-search text field with a datalist of
 * `"Name (ABBREV)"` options (auto-fills unit + ref range on selection),
 * or a free-text name for a custom parameter.
 */
import type { BiologicalSex } from "@kaiord/core";
import { useId } from "react";

import {
  findParameterByLabel,
  LAB_PARAMETER_OPTIONS,
} from "./lab-parameter-options";
import { type LabRowState, setRowMode } from "./lab-row-model";
import {
  selectCatalogParameter,
  setCustomName,
} from "./lab-row-parameter-selection";

const FIELD_CLASS =
  "rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

export type LabParameterIdentityFieldProps = {
  row: LabRowState;
  sex: BiologicalSex | undefined;
  onChange: (next: LabRowState) => void;
};

export function LabParameterIdentityField({
  row,
  sex,
  onChange,
}: LabParameterIdentityFieldProps) {
  const datalistId = useId();

  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex gap-2 text-xs">
        {(["catalog", "custom"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={row.mode === mode}
            onClick={() => onChange(setRowMode(row, mode))}
            className={row.mode === mode ? "font-semibold underline" : ""}
          >
            {mode === "catalog" ? "Catalog" : "Custom"}
          </button>
        ))}
      </div>
      {row.mode === "catalog" ? (
        <>
          <input
            list={datalistId}
            aria-label="Parameter"
            placeholder="Search parameter…"
            value={row.catalogLabel}
            className={FIELD_CLASS}
            onChange={(e) => {
              const label = e.target.value;
              const param = findParameterByLabel(label);
              onChange(selectCatalogParameter(row, label, param, sex));
            }}
          />
          <datalist id={datalistId}>
            {LAB_PARAMETER_OPTIONS.map((option) => (
              <option key={option.key} value={option.label} />
            ))}
          </datalist>
        </>
      ) : (
        <input
          aria-label="Custom parameter name"
          placeholder="Parameter name"
          value={row.customName}
          className={FIELD_CLASS}
          onChange={(e) => onChange(setCustomName(row, e.target.value))}
        />
      )}
    </div>
  );
}
