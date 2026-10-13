/**
 * PhysiologyFields Component
 *
 * Optional anthropometric inputs (height, birth date, sex, resting HR,
 * activity level) used for basal-metabolic-rate estimation. All optional —
 * empty values clear the field rather than persisting a zero.
 */

import { useUnits } from "../../../../contexts/units-context";
import { useTranslate } from "../../../../i18n/use-translate";
import {
  heightFromDisplay,
  heightToDisplay,
  heightUnitLabel,
} from "../../../../lib/units/body-measures";
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
  const t = useTranslate("athlete");
  const units = useUnits();
  return (
    <>
      <Input
        label={t("profileManager.personal.height", {
          unit: heightUnitLabel(units),
        })}
        variant="number"
        value={heightToDisplay(formData.height, units)?.toString() ?? ""}
        onChange={(e) =>
          onChange({
            ...formData,
            height: heightFromDisplay(numberOrUndefined(e.target.value), units),
          })
        }
        placeholder="175"
      />
      <Input
        label={t("profileManager.personal.birthDate")}
        type="date"
        value={formData.birthDate ?? ""}
        onChange={(e) =>
          onChange({ ...formData, birthDate: e.target.value || undefined })
        }
      />
      <Input
        label={t("profileManager.personal.restingHeartRate")}
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
