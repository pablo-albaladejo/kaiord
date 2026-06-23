/**
 * PhysiologyFields Component
 *
 * Optional anthropometric inputs (height, birth date, sex, resting HR,
 * activity level) used for basal-metabolic-rate estimation. All optional —
 * empty values clear the field rather than persisting a zero.
 */

import { Input } from "../../../atoms/Input/Input";
import type { ProfileFormData } from "../types";
import { PhysiologySelects } from "./PhysiologySelects";

type PhysiologyFieldsProps = {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
};

const numberOrUndefined = (raw: string): number | undefined =>
  raw ? Number(raw) : undefined;

export function PhysiologyFields({
  formData,
  onChange,
}: PhysiologyFieldsProps) {
  return (
    <>
      <Input
        label="Height (cm)"
        variant="number"
        value={formData.height?.toString() ?? ""}
        onChange={(e) =>
          onChange({ ...formData, height: numberOrUndefined(e.target.value) })
        }
        placeholder="175"
      />
      <Input
        label="Birth Date"
        type="date"
        value={formData.birthDate ?? ""}
        onChange={(e) =>
          onChange({ ...formData, birthDate: e.target.value || undefined })
        }
      />
      <Input
        label="Resting Heart Rate (bpm)"
        variant="number"
        value={formData.restingHeartRate?.toString() ?? ""}
        onChange={(e) =>
          onChange({
            ...formData,
            restingHeartRate: numberOrUndefined(e.target.value),
          })
        }
        placeholder="55"
      />
      <PhysiologySelects formData={formData} onChange={onChange} />
    </>
  );
}
