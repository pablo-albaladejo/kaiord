/**
 * GoalFormControls — the goal-type selector plus the three numeric/date fields.
 * Pure controlled inputs; the parent owns state and submission.
 */
import type { GoalType } from "@kaiord/core";
import { useId } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { GoalFormFields } from "./goal-form-model";
import { GoalNumberField } from "./GoalNumberField";

const GOAL_TYPES: GoalType[] = ["fat_loss", "muscle_gain", "maintain"];

export type GoalFormControlsProps = {
  fields: GoalFormFields;
  onChange: (next: GoalFormFields) => void;
};

export function GoalFormControls({ fields, onChange }: GoalFormControlsProps) {
  const typeId = useId();
  const t = useTranslate("nutrition");
  const set = (key: keyof GoalFormFields) => (value: string) =>
    onChange({ ...fields, [key]: value });

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={typeId} className="text-sm font-medium">
        {t("goalSetup.goalType")}
        <select
          id={typeId}
          value={fields.goalType}
          onChange={(e) => set("goalType")(e.target.value as GoalType)}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {GOAL_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`goalSetup.types.${value}`)}
            </option>
          ))}
        </select>
      </label>
      <GoalNumberField
        label={t("goalSetup.startWeight")}
        value={fields.startWeightKg}
        onChange={set("startWeightKg")}
      />
      <GoalNumberField
        label={t("goalSetup.targetWeight")}
        value={fields.targetWeightKg}
        onChange={set("targetWeightKg")}
      />
      <GoalNumberField
        label={t("goalSetup.targetDate")}
        type="date"
        value={fields.targetDate}
        onChange={set("targetDate")}
      />
    </div>
  );
}
