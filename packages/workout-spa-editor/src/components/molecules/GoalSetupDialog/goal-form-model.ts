/**
 * Pure validation for the goal-setup form. No React, no persistence;
 * unit-tested in isolation.
 *
 * `validateGoalForm` parses the raw string fields into a typed draft (or a
 * field-keyed error message). The preview math lives in `goal-preview.ts`.
 */

import type { GoalType } from "@kaiord/core";

export type GoalFormDraft = {
  goalType: GoalType;
  startWeightKg: number;
  targetWeightKg: number;
  targetDate: string;
  /** When true the user accepted an unsafe pace, overriding the safety cap. */
  overrideCap: boolean;
};

export type GoalFormFields = {
  goalType: GoalType;
  startWeightKg: string;
  targetWeightKg: string;
  targetDate: string;
  overrideCap: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const parsePositive = (raw: string): number | null => {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

export const validateGoalForm = (
  fields: GoalFormFields,
  today: string
): { draft: GoalFormDraft } | { error: string } => {
  const startWeightKg = parsePositive(fields.startWeightKg);
  if (startWeightKg === null) return { error: "Enter a valid start weight." };
  const targetWeightKg = parsePositive(fields.targetWeightKg);
  if (targetWeightKg === null) return { error: "Enter a valid target weight." };
  if (!DATE_RE.test(fields.targetDate))
    return { error: "Enter a target date (YYYY-MM-DD)." };
  if (fields.targetDate <= today)
    return { error: "Target date must be in the future." };
  return {
    draft: {
      goalType: fields.goalType,
      startWeightKg,
      targetWeightKg,
      targetDate: fields.targetDate,
      overrideCap: fields.overrideCap,
    },
  };
};
