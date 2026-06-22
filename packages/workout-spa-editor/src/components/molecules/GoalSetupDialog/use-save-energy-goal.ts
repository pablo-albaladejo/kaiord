/**
 * use-save-energy-goal — UI hook bridging the goal form to the device-local
 * `energyTargets` store. Writes the single active `EnergyTargetRecord` for the
 * profile (a new goal overwrites the prior one) and surfaces a PII-safe toast.
 *
 * A `useRef` in-flight lock (set synchronously before the first `await`) drops
 * a re-entrant submit while a write is pending; `isSaving` mirrors it for the
 * disabled Save button.
 */
import { useRef, useState } from "react";

import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { energyTargetRecordSchema } from "../../../types/energy-target-record";
import type { GoalFormDraft } from "./goal-form-model";

const TOAST_GOAL_SAVED = "Goal saved";
const TOAST_GOAL_SAVE_FAILED = "Could not save goal — please retry";

export type UseSaveEnergyGoalResult = {
  submit: (draft: GoalFormDraft) => Promise<boolean>;
  isSaving: boolean;
};

export function useSaveEnergyGoal(profileId: string): UseSaveEnergyGoalResult {
  const persistence = usePersistence();
  const toast = useToastContext();
  const inFlight = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (draft: GoalFormDraft): Promise<boolean> => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const existing = await persistence.energyTargets.get(profileId);
      const record = energyTargetRecordSchema.parse({
        profileId,
        goalType: draft.goalType,
        startWeightKg: draft.startWeightKg,
        targetWeightKg: draft.targetWeightKg,
        targetDate: draft.targetDate,
        overrideCap: draft.overrideCap,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
      await persistence.energyTargets.put(record);
      toast.success(TOAST_GOAL_SAVED);
      return true;
    } catch {
      toast.error(TOAST_GOAL_SAVE_FAILED);
      return false;
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  };

  return { submit, isSaving };
}
