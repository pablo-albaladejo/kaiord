import { useState } from "react";
import type { Duration } from "../../../types/krd";

export type AdvancedDurationPickerProps = {
  value: Duration | null;
  onChange: (duration: Duration | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

type AdvancedDurationType =
  | "calories"
  | "power_less_than"
  | "power_greater_than"
  | "heart_rate_less_than"
  | "repeat_until_time"
  | "repeat_until_distance"
  | "repeat_until_calories"
  | "repeat_until_heart_rate_greater_than"
  | "repeat_until_heart_rate_less_than"
  | "repeat_until_power_less_than"
  | "repeat_until_power_greater_than";

const DURATION_TYPE_OPTIONS: Array<{
  value: AdvancedDurationType;
  label: string;
}> = [
  { value: "calories", label: "Calories" },
  { value: "power_less_than", label: "Power Less Than" },
  { value: "power_greater_than", label: "Power Greater Than" },
  { value: "heart_rate_less_than", label: "Heart Rate Less Than" },
  { value: "repeat_until_time", label: "Repeat Until Time" },
  { value: "repeat_until_distance", label: "Repeat Until Distance" },
  { value: "repeat_until_calories", label: "Repeat Until Calories" },
  {
    value: "repeat_until_heart_rate_greater_than",
    label: "Repeat Until HR Greater Than",
  },
  {
    value: "repeat_until_heart_rate_less_than",
    label: "Repeat Until HR Less Than",
  },
  {
    value: "repeat_until_power_less_than",
    label: "Repeat Until Power Less Than",
  },
  {
    value: "repeat_until_power_greater_than",
    label: "Repeat Until Power Greater Than",
  },
];

const getDurationTypeFromValue = (
  value: Duration | null
): AdvancedDurationType => {
  if (!value) return "calories";
  if (
    value.type === "calories" ||
    value.type === "power_less_than" ||
    value.type === "power_greater_than" ||
    value.type === "heart_rate_less_than" ||
    value.type === "repeat_until_time" ||
    value.type === "repeat_until_distance" ||
    value.type === "repeat_until_calories" ||
    value.type === "repeat_until_heart_rate_greater_than" ||
    value.type === "repeat_until_heart_rate_less_than" ||
    value.type === "repeat_until_power_less_than" ||
    value.type === "repeat_until_power_greater_than"
  ) {
    return value.type;
  }
  return "calories";
};

const getValueFromDuration = (value: Duration | null): string => {
  if (!value) return "";
  if (value.type === "calories") return value.calories.toString();
  if (value.type === "power_less_than") return value.watts.toString();
  if (value.type === "power_greater_than") return value.watts.toString();
  if (value.type === "heart_rate_less_than") return value.bpm.toString();
  if (value.type === "repeat_until_time") return value.seconds.toString();
  if (value.type === "repeat_until_distance") return value.meters.toString();
  if (value.type === "repeat_until_calories") return value.calories.toString();
  if (value.type === "repeat_until_heart_rate_greater_than")
    return value.bpm.toString();
  if (value.type === "repeat_until_heart_rate_less_than")
    return value.bpm.toString();
  if (value.type === "repeat_until_power_less_than")
    return value.watts.toString();
  if (value.type === "repeat_until_power_greater_than")
    return value.watts.toString();
  return "";
};

const getRepeatFromValue = (value: Duration | null): string => {
  if (!value) return "0";
  if (
    value.type === "repeat_until_time" ||
    value.type === "repeat_until_distance" ||
    value.type === "repeat_until_calories" ||
    value.type === "repeat_until_heart_rate_greater_than" ||
    value.type === "repeat_until_heart_rate_less_than" ||
    value.type === "repeat_until_power_less_than" ||
    value.type === "repeat_until_power_greater_than"
  ) {
    return value.repeatFrom.toString();
  }
  return "0";
};

const getValueLabel = (durationType: AdvancedDurationType): string => {
  if (durationType === "calories") return "Calories";
  if (durationType === "power_less_than") return "Power (watts)";
  if (durationType === "power_greater_than") return "Power (watts)";
  if (durationType === "heart_rate_less_than") return "Heart Rate (bpm)";
  if (durationType === "repeat_until_time") return "Time (seconds)";
  if (durationType === "repeat_until_distance") return "Distance (meters)";
  if (durationType === "repeat_until_calories") return "Calories";
  if (durationType === "repeat_until_heart_rate_greater_than")
    return "Heart Rate (bpm)";
  if (durationType === "repeat_until_heart_rate_less_than")
    return "Heart Rate (bpm)";
  if (durationType === "repeat_until_power_less_than") return "Power (watts)";
  if (durationType === "repeat_until_power_greater_than")
    return "Power (watts)";
  return "";
};

const isRepeatType = (durationType: AdvancedDurationType): boolean => {
  return durationType.startsWith("repeat_until_");
};

const validateValue = (
  durationType: AdvancedDurationType,
  value: string
): { isValid: boolean; error?: string } => {
  const numValue = Number(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: "Must be a valid number" };
  }

  if (numValue <= 0) {
    return { isValid: false, error: "Must be greater than 0" };
  }

  // Type-specific validation
  if (durationType === "calories" || durationType === "repeat_until_calories") {
    if (numValue > 10000) {
      return { isValid: false, error: "Calories cannot exceed 10,000" };
    }
  }

  if (
    durationType === "power_less_than" ||
    durationType === "power_greater_than" ||
    durationType === "repeat_until_power_less_than" ||
    durationType === "repeat_until_power_greater_than"
  ) {
    if (numValue > 2000) {
      return { isValid: false, error: "Power cannot exceed 2,000 watts" };
    }
  }

  if (
    durationType === "heart_rate_less_than" ||
    durationType === "repeat_until_heart_rate_greater_than" ||
    durationType === "repeat_until_heart_rate_less_than"
  ) {
    if (numValue > 220) {
      return { isValid: false, error: "Heart rate cannot exceed 220 bpm" };
    }
  }

  if (durationType === "repeat_until_time") {
    if (numValue > 86400) {
      return { isValid: false, error: "Time cannot exceed 24 hours" };
    }
  }

  if (durationType === "repeat_until_distance") {
    if (numValue > 1000000) {
      return { isValid: false, error: "Distance cannot exceed 1,000 km" };
    }
  }

  return { isValid: true };
};

const validateRepeatFrom = (
  value: string
): { isValid: boolean; error?: string } => {
  const numValue = Number(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: "Must be a valid number" };
  }

  if (numValue < 0) {
    return { isValid: false, error: "Cannot be negative" };
  }

  return { isValid: true };
};

export const AdvancedDurationPicker = ({
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}: AdvancedDurationPickerProps) => {
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

  const handleValueChange = (newValue: string) => {
    setDurationValue(newValue);

    const validation = validateValue(durationType, newValue);
    if (!validation.isValid) {
      setValidationError(validation.error || "");
      onChange(null);
      return;
    }

    const numValue = Number(newValue);

    // Build duration object based on type
    if (durationType === "calories") {
      onChange({ type: "calories", calories: Math.floor(numValue) });
      setValidationError("");
    } else if (durationType === "power_less_than") {
      onChange({ type: "power_less_than", watts: numValue });
      setValidationError("");
    } else if (durationType === "power_greater_than") {
      onChange({ type: "power_greater_than", watts: numValue });
      setValidationError("");
    } else if (durationType === "heart_rate_less_than") {
      onChange({ type: "heart_rate_less_than", bpm: Math.floor(numValue) });
      setValidationError("");
    } else if (isRepeatType(durationType)) {
      // For repeat types, we need both value and repeatFrom
      const repeatFromValidation = validateRepeatFrom(repeatFrom);
      if (!repeatFromValidation.isValid) {
        setValidationError(repeatFromValidation.error || "");
        onChange(null);
        return;
      }

      const repeatFromNum = Number(repeatFrom);
      buildRepeatDuration(durationType, numValue, repeatFromNum);
      setValidationError("");
    }
  };

  const handleRepeatFromChange = (newRepeatFrom: string) => {
    setRepeatFrom(newRepeatFrom);

    if (!isRepeatType(durationType)) {
      return;
    }

    const validation = validateRepeatFrom(newRepeatFrom);
    if (!validation.isValid) {
      setValidationError(validation.error || "");
      onChange(null);
      return;
    }

    const valueValidation = validateValue(durationType, durationValue);
    if (!valueValidation.isValid) {
      setValidationError(valueValidation.error || "");
      onChange(null);
      return;
    }

    const numValue = Number(durationValue);
    const repeatFromNum = Number(newRepeatFrom);
    buildRepeatDuration(durationType, numValue, repeatFromNum);
    setValidationError("");
  };

  const buildRepeatDuration = (
    type: AdvancedDurationType,
    value: number,
    repeatFromValue: number
  ) => {
    if (type === "repeat_until_time") {
      onChange({
        type: "repeat_until_time",
        seconds: value,
        repeatFrom: repeatFromValue,
      });
    } else if (type === "repeat_until_distance") {
      onChange({
        type: "repeat_until_distance",
        meters: value,
        repeatFrom: repeatFromValue,
      });
    } else if (type === "repeat_until_calories") {
      onChange({
        type: "repeat_until_calories",
        calories: Math.floor(value),
        repeatFrom: repeatFromValue,
      });
    } else if (type === "repeat_until_heart_rate_greater_than") {
      onChange({
        type: "repeat_until_heart_rate_greater_than",
        bpm: Math.floor(value),
        repeatFrom: repeatFromValue,
      });
    } else if (type === "repeat_until_heart_rate_less_than") {
      onChange({
        type: "repeat_until_heart_rate_less_than",
        bpm: Math.floor(value),
        repeatFrom: repeatFromValue,
      });
    } else if (type === "repeat_until_power_less_than") {
      onChange({
        type: "repeat_until_power_less_than",
        watts: value,
        repeatFrom: repeatFromValue,
      });
    } else if (type === "repeat_until_power_greater_than") {
      onChange({
        type: "repeat_until_power_greater_than",
        watts: value,
        repeatFrom: repeatFromValue,
      });
    }
  };

  const displayError = error || validationError;

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label
          htmlFor="advanced-duration-type"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Duration Type
        </label>
        <select
          id="advanced-duration-type"
          value={durationType}
          onChange={(e) =>
            handleTypeChange(e.target.value as AdvancedDurationType)
          }
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
        >
          {DURATION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="advanced-duration-value"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {getValueLabel(durationType)}
        </label>
        <input
          id="advanced-duration-value"
          type="number"
          value={durationValue}
          onChange={(e) => handleValueChange(e.target.value)}
          disabled={disabled}
          min="0"
          step={
            durationType === "calories" ||
            durationType === "repeat_until_calories" ||
            durationType.includes("heart_rate")
              ? "1"
              : "0.1"
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
        />
      </div>

      {isRepeatType(durationType) && (
        <div>
          <label
            htmlFor="advanced-duration-repeat-from"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Repeat From Step
          </label>
          <input
            id="advanced-duration-repeat-from"
            type="number"
            value={repeatFrom}
            onChange={(e) => handleRepeatFromChange(e.target.value)}
            disabled={disabled}
            min="0"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Step index to repeat from (0 for beginning)
          </p>
        </div>
      )}

      {displayError && (
        <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
      )}
    </div>
  );
};
