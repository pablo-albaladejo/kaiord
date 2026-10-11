/**
 * PhysiologySelects — the two enum dropdowns (sex, activity level) of the
 * physiological profile inputs. Split from PhysiologyFields to keep each file
 * and component under the line cap.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import type { ActivityLevel, BiologicalSex } from "../../../../types/profile";
import { Input } from "../../../atoms/Input/Input";
import type { ProfileFormData } from "../types";

type PhysiologySelectsProps = {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
};

const SEX_VALUES = ["", "male", "female"] as const;

const ACTIVITY_VALUES = [
  "",
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
] as const;

// The empty value is "not set" in both selects.
const optionKey = (group: string, value: string) =>
  `profileManager.personal.${value ? `${group}.${value}` : "notSet"}`;

export function PhysiologySelects({
  formData,
  onChange,
}: PhysiologySelectsProps) {
  const t = useTranslate("athlete");
  const options = (group: string, values: ReadonlyArray<string>) =>
    values.map((value) => ({ value, label: t(optionKey(group, value)) }));
  return (
    <>
      <Input
        label={t("profileManager.personal.sex")}
        variant="select"
        options={options("sexes", SEX_VALUES)}
        value={formData.sex ?? ""}
        onChange={(e) =>
          onChange({
            ...formData,
            sex: (e.target.value || undefined) as BiologicalSex | undefined,
          })
        }
      />
      <Input
        label={t("profileManager.personal.activityLevel")}
        variant="select"
        options={options("activityLevels", ACTIVITY_VALUES)}
        value={formData.activityLevel ?? ""}
        onChange={(e) =>
          onChange({
            ...formData,
            activityLevel: (e.target.value || undefined) as
              ActivityLevel | undefined,
          })
        }
      />
    </>
  );
}
