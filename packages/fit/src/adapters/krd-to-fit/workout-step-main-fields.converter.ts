import { Profile, type ProfileSubField } from "@garmin/fitsdk";

import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import { getProfileFields } from "../shared/profile-fields";

const WORKOUT_STEP_FIELDS = getProfileFields(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);

const toRawRefValue = (
  message: Record<string, unknown>,
  refFieldName: string
): number | undefined => {
  const value = message[refFieldName];
  if (typeof value === "number") return value;
  const refField = WORKOUT_STEP_FIELDS.find((f) => f.name === refFieldName);
  const names = refField ? Profile.types[refField.type] : undefined;
  if (!names || typeof names !== "object") return undefined;
  const entry = Object.entries(names).find(([, name]) => name === value);
  return entry ? Number(entry[0]) : undefined;
};

const isActive = (
  subField: ProfileSubField,
  message: Record<string, unknown>
): boolean =>
  subField.map.some((m) => toRawRefValue(message, m.name) === m.value);

/**
 * The SDK Encoder only writes a message's main fields: a value set under a
 * sub-field name (`durationDistance`, `targetPowerZone`, `repeatSteps`, ...)
 * is silently dropped. For each main field whose active sub-field (per the
 * profile's `durationType`/`targetType` map) is set on the message, the main
 * field is filled with that sub-field's raw value (value * scale + offset),
 * which is what the Decoder reads back.
 */
export const addWorkoutStepMainFields = (
  message: Record<string, unknown>
): Record<string, unknown> => {
  const result = { ...message };
  for (const field of WORKOUT_STEP_FIELDS) {
    const active = field.subFields.find(
      (sub) => typeof message[sub.name] === "number" && isActive(sub, message)
    );
    if (!active) continue;
    const value = message[active.name] as number;
    result[field.name] = Math.round(value * active.scale + active.offset);
  }
  return result;
};
