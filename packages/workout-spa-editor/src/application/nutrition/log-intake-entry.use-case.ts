/**
 * logIntakeEntry — application use case for a hand-logged nutrition intake
 * entry for one day.
 *
 * Validates the energy + macro values against `intakeEntryRecordSchema`
 * (non-negative; negatives are rejected), mints a fresh id, and stamps
 * `loggedAt` from the injected clock so the entry is reproducible in tests.
 * The day-level roll-up is computed downstream by `buildDayEnergyBalance`.
 */
import type { MealSlot } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import {
  type IntakeEntryRecord,
  intakeEntryRecordSchema,
} from "../../types/intake-entry-record";

export type LogIntakeEntryDeps = {
  persistence: PersistencePort;
  profileId: string;
  newId?: () => string;
  now?: () => string;
};

export type LogIntakeEntryInput = {
  date: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  label?: string;
  mealSlot?: MealSlot;
};

/**
 * Persist one intake entry. Returns the stored record, or `undefined` when
 * the values fail validation (e.g. a negative kcal/macro) — no write occurs.
 */
export const logIntakeEntry = async (
  deps: LogIntakeEntryDeps,
  input: LogIntakeEntryInput
): Promise<IntakeEntryRecord | undefined> => {
  const { persistence, profileId } = deps;
  const candidate = {
    id: deps.newId?.() ?? crypto.randomUUID(),
    profileId,
    date: input.date,
    loggedAt: deps.now?.() ?? new Date().toISOString(),
    label: input.label,
    mealSlot: input.mealSlot,
    kcal: input.kcal,
    proteinG: input.proteinG,
    carbG: input.carbG,
    fatG: input.fatG,
  };
  const parsed = intakeEntryRecordSchema.safeParse(candidate);
  if (!parsed.success) return undefined;
  await persistence.intakeEntries.put(parsed.data);
  return parsed.data;
};
