import { TargetPickerRangeInput } from "./TargetPickerRangeInput";

type TargetPickerRangeFieldsProps = {
  minValue: string;
  maxValue: string;
  displayError: string;
  disabled: boolean;
  onMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const TargetPickerRangeFields = ({
  minValue,
  maxValue,
  displayError,
  disabled,
  onMinChange,
  onMaxChange,
}: TargetPickerRangeFieldsProps) => {
  const hasError = Boolean(displayError);

  return (
    <div className="space-y-3">
      <TargetPickerRangeInput
        label="Minimum"
        value={minValue}
        onChange={onMinChange}
        disabled={disabled}
        placeholder="Enter minimum value"
        ariaLabel="Minimum value"
        hasError={hasError}
      />
      <TargetPickerRangeInput
        label="Maximum"
        value={maxValue}
        onChange={onMaxChange}
        disabled={disabled}
        placeholder="Enter maximum value"
        ariaLabel="Maximum value"
        hasError={hasError}
      />
      {displayError && (
        <p
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          id="target-range-error"
        >
          {displayError}
        </p>
      )}
    </div>
  );
};
