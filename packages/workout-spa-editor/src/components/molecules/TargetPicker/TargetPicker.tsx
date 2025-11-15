import { useState } from "react";
import {
  getCurrentUnit,
  getRangeMaxString,
  getRangeMinString,
  getTargetTypeFromValue,
  getUnitOptions,
  getValueLabel,
  getValuePlaceholder,
  getValueString,
} from "./helpers";
import {
  useRangeChange,
  useTypeChange,
  useUnitChange,
  useValueChange,
} from "./hooks";
import type { TargetPickerProps } from "./TargetPicker.types";
import { TargetPickerFields } from "./TargetPickerFields";

export const TargetPicker = ({
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}: TargetPickerProps) => {
  const [targetType, setTargetType] = useState<
    "power" | "heart_rate" | "pace" | "cadence" | "open"
  >(getTargetTypeFromValue(value));
  const [unit, setUnit] = useState<string>(getCurrentUnit(value));
  const [targetValue, setTargetValue] = useState<string>(getValueString(value));
  const [minValue, setMinValue] = useState<string>(getRangeMinString(value));
  const [maxValue, setMaxValue] = useState<string>(getRangeMaxString(value));
  const [validationError, setValidationError] = useState<string>("");

  const handleTypeChange = useTypeChange(
    onChange,
    setTargetType,
    setValidationError,
    setUnit,
    setTargetValue,
    setMinValue,
    setMaxValue
  );

  const handleUnitChange = useUnitChange(
    onChange,
    setUnit,
    setValidationError,
    setTargetValue,
    setMinValue,
    setMaxValue
  );

  const handleValueChange = useValueChange(
    targetType,
    unit,
    onChange,
    setTargetValue,
    setValidationError
  );

  const handleRangeChange = useRangeChange(
    targetType,
    unit,
    onChange,
    setValidationError
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = e.target.value;
    setMinValue(newMin);
    handleRangeChange(newMin, maxValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = e.target.value;
    setMaxValue(newMax);
    handleRangeChange(minValue, newMax);
  };

  const displayError = error || validationError;
  const unitOptions = getUnitOptions(targetType) || [];

  return (
    <div className={`space-y-4 ${className}`}>
      <TargetPickerFields
        targetType={targetType}
        unit={unit}
        targetValue={targetValue}
        minValue={minValue}
        maxValue={maxValue}
        displayError={displayError}
        disabled={disabled}
        unitOptions={unitOptions}
        onTypeChange={handleTypeChange}
        onUnitChange={handleUnitChange}
        onValueChange={handleValueChange}
        onMinChange={handleMinChange}
        onMaxChange={handleMaxChange}
        getValueLabel={getValueLabel}
        getValuePlaceholder={getValuePlaceholder}
      />
    </div>
  );
};
