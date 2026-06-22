/**
 * saveIntakePreset — persists a reusable quick-log intake preset.
 *
 * Validates against `intakePresetRecordSchema` (non-negative energy + macros,
 * non-empty label), mints a fresh id, and stamps `createdAt` from the injected
 * clock. Returns the stored record, or `undefined` on validation failure.
 */
import type { MealSlot } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import {
  type IntakePresetRecord,
  intakePresetRecordSchema,
} from "../../types/intake-preset-record";

export type SaveIntakePresetDeps = {
  persistence: PersistencePort;
  profileId: string;
  newId?: () => string;
  now?: () => string;
};

export type SaveIntakePresetInput = {
  label: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  defaultMealSlot?: MealSlot;
};

export const saveIntakePreset = async (
  deps: SaveIntakePresetDeps,
  input: SaveIntakePresetInput
): Promise<IntakePresetRecord | undefined> => {
  const candidate = {
    id: deps.newId?.() ?? crypto.randomUUID(),
    profileId: deps.profileId,
    label: input.label,
    kcal: input.kcal,
    proteinG: input.proteinG,
    carbG: input.carbG,
    fatG: input.fatG,
    defaultMealSlot: input.defaultMealSlot,
    createdAt: deps.now?.() ?? new Date().toISOString(),
  };
  const parsed = intakePresetRecordSchema.safeParse(candidate);
  if (!parsed.success) return undefined;
  await deps.persistence.intakePresets.put(parsed.data);
  return parsed.data;
};
