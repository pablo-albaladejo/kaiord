import type { ManualSleepEntry } from "../../../application/health/manual-sleep-payload.converter";
import {
  collectSleepFields,
  type SleepFields,
  type SleepFieldsError,
} from "./sleep-entry-fields";

export type WellnessFields = {
  weight: string;
  hrv: string;
  steps: string;
  sleep: SleepFields;
};

export type WellnessValues = {
  weight?: number;
  hrv?: number;
  "daily-wellness"?: number;
  sleep?: ManualSleepEntry;
};

export const EMPTY_WELLNESS_FIELDS: WellnessFields = {
  weight: "",
  hrv: "",
  steps: "",
  sleep: { hours: "", score: "", bedtime: "", wakeTime: "" },
};

const numberOf = (raw: string): number | undefined => {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Every filled field as a value; blank fields are left out. */
export const collectWellness = (
  fields: WellnessFields,
  day: string
): { values: WellnessValues } | { error: SleepFieldsError } => {
  const sleep = collectSleepFields(fields.sleep, day);
  if ("error" in sleep) return { error: sleep.error };
  const values: WellnessValues = {
    weight: numberOf(fields.weight),
    hrv: numberOf(fields.hrv),
    "daily-wellness": numberOf(fields.steps),
    sleep: sleep.entry,
  };
  return {
    values: Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined)
    ),
  };
};
