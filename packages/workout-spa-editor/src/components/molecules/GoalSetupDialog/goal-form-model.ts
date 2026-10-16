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

/** Key under `nutrition:goalSetup.errors` naming the first invalid field. */
export type GoalFormError =
  "startWeight" | "targetWeight" | "targetDate" | "pastDate";

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
): { draft: GoalFormDraft } | { error: GoalFormError } => {
  const startWeightKg = parsePositive(fields.startWeightKg);
  if (startWeightKg === null) return { error: "startWeight" };
  const targetWeightKg = parsePositive(fields.targetWeightKg);
  if (targetWeightKg === null) return { error: "targetWeight" };
  if (!DATE_RE.test(fields.targetDate)) return { error: "targetDate" };
  if (fields.targetDate <= today) return { error: "pastDate" };
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
