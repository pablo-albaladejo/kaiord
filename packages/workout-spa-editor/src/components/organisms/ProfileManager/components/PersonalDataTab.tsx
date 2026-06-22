/**
 * PersonalDataTab Component
 *
 * Tab content for personal data fields: body weight plus the optional
 * physiological inputs (height, birth date, sex, resting HR, activity level)
 * that feed basal-metabolic-rate estimation.
 */

import { Input } from "../../../atoms/Input/Input";
import type { ProfileFormData } from "../types";
import { PhysiologyFields } from "./PhysiologyFields";

type PersonalDataTabProps = {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
};

export function PersonalDataTab({ formData, onChange }: PersonalDataTabProps) {
  return (
    <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label="Body Weight (kg)"
        variant="number"
        value={formData.bodyWeight?.toString() ?? ""}
        onChange={(e) =>
          onChange({
            ...formData,
            bodyWeight: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        placeholder="70"
      />
      <PhysiologyFields formData={formData} onChange={onChange} />
    </div>
  );
}
