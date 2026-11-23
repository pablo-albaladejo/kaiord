import type { ParsedExecutableStep } from "../schemas/garmin-workout-parse.schema";

const STROKE_KEY_BY_ID: Readonly<Record<number, string>> = {
  1: "any_stroke",
  2: "backstroke",
  3: "breaststroke",
  4: "drill",
  5: "fly",
  6: "free",
  7: "mixed",
  8: "im",
};

const EQUIPMENT_KEY_BY_ID: Readonly<Record<number, string>> = {
  1: "fins",
  2: "kickboard",
  3: "paddles",
  4: "pull_buoy",
  5: "snorkel",
};

/** The step's stroke key, or the key of its Garmin id when the step names none. */
export const strokeKeyOf = (step: ParsedExecutableStep): string | null => {
  const stroke = step.strokeType;
  if (stroke?.strokeTypeKey !== undefined) return stroke.strokeTypeKey;
  return STROKE_KEY_BY_ID[stroke?.strokeTypeId ?? 0] ?? null;
};

/** The step's equipment key, or the key of its Garmin id when the step names none. */
export const equipmentKeyOf = (step: ParsedExecutableStep): string | null => {
  const equipment = step.equipmentType;
  if (equipment?.equipmentTypeKey !== undefined)
    return equipment.equipmentTypeKey;
  return EQUIPMENT_KEY_BY_ID[equipment?.equipmentTypeId ?? 0] ?? null;
};
