/**
 * GoalSetupForm — orchestrates the goal controls, live preview, and save.
 *
 * Validation + the core goal math run purely in `goal-form-model`; this
 * component owns only the field state, the maintenance baseline read, and the
 * submit wiring. A successful save calls `onSaved` so the dialog can close.
 */
import type { GoalType } from "@kaiord/core";
import { useState } from "react";

import { type GoalFormFields, validateGoalForm } from "./goal-form-model";
import { previewGoal } from "./goal-preview";
import { GoalCapOverrideToggle } from "./GoalCapOverrideToggle";
import { GoalFormControls } from "./GoalFormControls";
import { GoalPreviewPanel } from "./GoalPreviewPanel";
import { useGoalBaseline } from "./use-goal-baseline";
import { useSaveEnergyGoal } from "./use-save-energy-goal";

export type GoalSetupFormProps = {
  profileId: string;
  today: string;
  onSaved: () => void;
};

const initialFields = (start: string, goalType: GoalType): GoalFormFields => ({
  goalType,
  startWeightKg: start,
  targetWeightKg: "",
  targetDate: "",
  overrideCap: false,
});

export function GoalSetupForm({
  profileId,
  today,
  onSaved,
}: GoalSetupFormProps) {
  const baseline = useGoalBaseline(profileId, today);
  const [fields, setFields] = useState<GoalFormFields>(
    initialFields("", "fat_loss")
  );
  const { submit, isSaving } = useSaveEnergyGoal(profileId);

  const startDefault = baseline?.defaultStartWeightKg;
  const start =
    fields.startWeightKg || (startDefault != null ? String(startDefault) : "");
  const validation = validateGoalForm(
    { ...fields, startWeightKg: start },
    today
  );
  const maintenance = baseline?.maintenanceKcal ?? null;
  const preview =
    "draft" in validation && maintenance != null
      ? previewGoal(validation.draft, maintenance, today)
      : null;

  const handleSubmit = async () => {
    if (!("draft" in validation)) return;
    if (await submit(validation.draft)) onSaved();
  };

  return (
    <div className="flex flex-col gap-4">
      <GoalFormControls
        fields={{ ...fields, startWeightKg: start }}
        onChange={setFields}
      />
      {preview && <GoalPreviewPanel preview={preview} />}
      {preview?.capped && (
        <GoalCapOverrideToggle
          checked={fields.overrideCap}
          onChange={(overrideCap) => setFields({ ...fields, overrideCap })}
        />
      )}
      {"error" in validation && (
        <p role="alert" className="m-0 text-[12px] text-red-500">
          {validation.error}
        </p>
      )}
      <button
        type="button"
        disabled={isSaving || !("draft" in validation)}
        onClick={handleSubmit}
        data-testid="goal-save"
        className="mt-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Save goal
      </button>
    </div>
  );
}
