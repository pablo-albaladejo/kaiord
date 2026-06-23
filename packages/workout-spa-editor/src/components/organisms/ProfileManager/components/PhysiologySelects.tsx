/**
 * PhysiologySelects — the two enum dropdowns (sex, activity level) of the
 * physiological profile inputs. Split from PhysiologyFields to keep each file
 * and component under the line cap.
 */

import type { ActivityLevel, BiologicalSex } from "../../../../types/profile";
import { Input } from "../../../atoms/Input/Input";
import type { ProfileFormData } from "../types";

type PhysiologySelectsProps = {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
};

const SEX_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const ACTIVITY_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very active" },
];

export function PhysiologySelects({
  formData,
  onChange,
}: PhysiologySelectsProps) {
  return (
    <>
      <Input
        label="Sex"
        variant="select"
        options={SEX_OPTIONS}
        value={formData.sex ?? ""}
        onChange={(e) =>
          onChange({
            ...formData,
            sex: (e.target.value || undefined) as BiologicalSex | undefined,
          })
        }
      />
      <Input
        label="Activity Level"
        variant="select"
        options={ACTIVITY_OPTIONS}
        value={formData.activityLevel ?? ""}
        onChange={(e) =>
          onChange({
            ...formData,
            activityLevel: (e.target.value || undefined) as
              | ActivityLevel
              | undefined,
          })
        }
      />
    </>
  );
}
