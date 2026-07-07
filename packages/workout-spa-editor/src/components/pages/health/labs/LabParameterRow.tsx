/**
 * LabParameterRow — one parameter entry: identity (catalog/custom) +
 * measurement fields + a remove button. The differential leukocyte pair
 * (e.g. "Neutrófilos %" vs "Neutrófilos absolutos") is disambiguated by the
 * catalog's own distinct labels — no special-casing needed here.
 */
import type { BiologicalSex } from "@kaiord/core";

import type { LabRowState } from "./lab-row-model";
import { LabParameterIdentityField } from "./LabParameterIdentityField";
import { LabParameterMeasurementFields } from "./LabParameterMeasurementFields";

export type LabParameterRowProps = {
  row: LabRowState;
  sex: BiologicalSex | undefined;
  onChange: (next: LabRowState) => void;
  onRemove: () => void;
};

export function LabParameterRow({
  row,
  sex,
  onChange,
  onRemove,
}: LabParameterRowProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded border border-gray-200 p-3 dark:border-slate-800"
      data-testid="lab-parameter-row"
    >
      <div className="flex items-start justify-between gap-2">
        <LabParameterIdentityField row={row} sex={sex} onChange={onChange} />
        <button
          type="button"
          aria-label="Remove parameter"
          onClick={onRemove}
          className="text-sm text-gray-500 hover:text-red-600"
        >
          Remove
        </button>
      </div>
      <LabParameterMeasurementFields row={row} onChange={onChange} />
    </div>
  );
}
