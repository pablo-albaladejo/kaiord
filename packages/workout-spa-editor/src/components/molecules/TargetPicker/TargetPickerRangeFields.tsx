import { Input } from "../../atoms/Input/Input";

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
  return (
    <div className="space-y-3">
      <Input
        variant="number"
        label="Minimum"
        value={minValue}
        onChange={onMinChange}
        disabled={disabled}
        placeholder="Enter minimum value"
        min="0"
        step="0.01"
        aria-label="Minimum value"
        aria-invalid={Boolean(displayError)}
      />
      <Input
        variant="number"
        label="Maximum"
        value={maxValue}
        onChange={onMaxChange}
        disabled={disabled}
        placeholder="Enter maximum value"
        min="0"
        step="0.01"
        aria-label="Maximum value"
        aria-invalid={Boolean(displayError)}
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
