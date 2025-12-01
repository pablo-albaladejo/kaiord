/**
 * Advanced Duration Hook
 *
 * Manages state and logic for advanced duration picker.
 */

import { useState } from "react";
import type { Duration } from "../../../../types/krd";
import { buildDuration, validateRepeatFrom } from "./duration-builder";
import {
  getDurationTypeFromValue,
  getRepeatFromValue,
  getValueFromDuration,
  isRepeatType,
} from "./duration-helpers";
import type { AdvancedDurationType } from "./duration-type-options";
import { validateValue } from "./duration-validation";

export function useAdvancedDuration(
  value: Duration | null,
  onChange: (duration: Duration | null) => void
) {
  const [durationType, setDurationType] = useState<AdvancedDurationType>(
    getDurationTypeFromValue(value)
  );
  const [durationValue, setDurationValue] = useState<string>(
    getValueFromDuration(value)
  );
  const [repeatFrom, setRepeatFrom] = useState<string>(
    getRepeatFromValue(value)
  );
  const [validationError, setValidationError] = useState<string>("");

  const handleTypeChange = (newType: AdvancedDurationType) => {
    setDurationType(newType);
    setDurationValue("");
    setRepeatFrom("0");
    setValidationError("");
    onChange(null);
  };

  const updateDuration = (value: string, repeat: string) => {
    const numValue = Number(value);
    const repeatValue = isRepeatType(durationType) ? Number(repeat) : undefined;
    const duration = buildDuration(durationType, numValue, repeatValue);
    onChange(duration);
    setValidationError("");
  };

  const handleValueChange = (newValue: string) => {
    setDurationValue(newValue);
    const validation = validateValue(durationType, newValue);
    if (!validation.isValid) {
      setValidationError(validation.error || "");
      onChange(null);
      return;
    }
    updateDuration(newValue, repeatFrom);
  };

  const handleRepeatFromChange = (newValue: string) => {
    setRepeatFrom(newValue);
    const validation = validateRepeatFrom(newValue);
    if (!validation.isValid) {
      setValidationError(validation.error || "");
      return;
    }
    if (durationValue) updateDuration(durationValue, newValue);
  };

  return {
    durationType,
    durationValue,
    repeatFrom,
    validationError,
    handleTypeChange,
    handleValueChange,
    handleRepeatFromChange,
  };
}
