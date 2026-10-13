/**
 * PersonalDataTab Component
 *
 * Tab content for personal data fields: body weight plus the optional
 * physiological inputs (height, birth date, sex, resting HR, activity level)
 * that feed basal-metabolic-rate estimation.
 */

import { useUnits } from "../../../../contexts/units-context";
import { useTranslate } from "../../../../i18n/use-translate";
import {
  weightFromDisplay,
  weightToDisplay,
} from "../../../../lib/units/body-measures";
import { weightUnitLabel } from "../../../../lib/units/units";
import { Input } from "../../../atoms/Input/Input";
import type { ProfileFormData } from "../types";
import { PhysiologyFields } from "./PhysiologyFields";

type PersonalDataTabProps = {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
};

export function PersonalDataTab({ formData, onChange }: PersonalDataTabProps) {
  const t = useTranslate("athlete");
  const units = useUnits();
  const weight = weightToDisplay(formData.bodyWeight, units);
  return (
    <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label={t("profileManager.personal.bodyWeight", {
          unit: weightUnitLabel(units),
        })}
        variant="number"
        value={weight?.toString() ?? ""}
        onChange={(e) =>
          onChange({
            ...formData,
            bodyWeight: weightFromDisplay(
              e.target.value ? Number(e.target.value) : undefined,
              units
            ),
          })
        }
        placeholder="70"
      />
      <PhysiologyFields formData={formData} onChange={onChange} />
    </div>
  );
}
