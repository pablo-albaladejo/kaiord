import { useState } from "react";

import { EMPTY_WELLNESS_FIELDS, type WellnessFields } from "./collect-wellness";
import type { SleepFields } from "./sleep-entry-fields";

type NumberKey = Exclude<keyof WellnessFields, "sleep">;

export function useWellnessFields() {
  const [fields, setFields] = useState<WellnessFields>(EMPTY_WELLNESS_FIELDS);
  const setField = (key: NumberKey) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));
  const setSleepField = (key: keyof SleepFields) => (value: string) =>
    setFields((prev) => ({ ...prev, sleep: { ...prev.sleep, [key]: value } }));
  return { fields, setField, setSleepField };
}
