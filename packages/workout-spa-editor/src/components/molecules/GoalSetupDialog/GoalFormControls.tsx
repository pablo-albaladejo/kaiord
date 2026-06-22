/**
 * GoalFormControls — the goal-type selector plus the three numeric/date fields.
 * Pure controlled inputs; the parent owns state and submission.
 */
import type { GoalType } from "@kaiord/core";
import { useId } from "react";

import type { GoalFormFields } from "./goal-form-model";
import { GoalNumberField } from "./GoalNumberField";

const GOAL_LABELS: Record<GoalType, string> = {
  fat_loss: "Fat loss",
  muscle_gain: "Muscle gain",
  maintain: "Maintain",
};

export type GoalFormControlsProps = {
  fields: GoalFormFields;
  onChange: (next: GoalFormFields) => void;
};

export function GoalFormControls({ fields, onChange }: GoalFormControlsProps) {
  const typeId = useId();
  const set = (key: keyof GoalFormFields) => (value: string) =>
    onChange({ ...fields, [key]: value });

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={typeId} className="text-sm font-medium">
        Goal type
        <select
          id={typeId}
          value={fields.goalType}
          onChange={(e) => set("goalType")(e.target.value as GoalType)}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {Object.entries(GOAL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <GoalNumberField
        label="Start weight (kg)"
        value={fields.startWeightKg}
        onChange={set("startWeightKg")}
      />
      <GoalNumberField
        label="Target weight (kg)"
        value={fields.targetWeightKg}
        onChange={set("targetWeightKg")}
      />
      <GoalNumberField
        label="Target date"
        type="date"
        value={fields.targetDate}
        onChange={set("targetDate")}
      />
    </div>
  );
}
