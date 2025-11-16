import { DurationTypeSelect } from "./DurationTypeSelect";
import { DurationValueInput } from "./DurationValueInput";

type DurationPickerFieldsProps = {
  durationType: "time" | "distance" | "open";
  durationValue: string;
  displayError: string;
  disabled: boolean;
  onTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getValueLabel: (type: "time" | "distance" | "open") => string;
  getValuePlaceholder: (type: "time" | "distance" | "open") => string;
};

export const DurationPickerFields = ({
  durationType,
  durationValue,
  displayError,
  disabled,
  onTypeChange,
  onValueChange,
  getValueLabel,
  getValuePlaceholder,
}: DurationPickerFieldsProps) => {
  return (
    <>
      <DurationTypeSelect
        value={durationType}
        onChange={onTypeChange}
        disabled={disabled}
      />

      {durationType !== "open" && (
        <DurationValueInput
          durationType={durationType}
          value={durationValue}
          onChange={onValueChange}
          disabled={disabled}
          error={displayError}
          getValueLabel={getValueLabel}
          getValuePlaceholder={getValuePlaceholder}
        />
      )}

      {durationType === "open" && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Open-ended duration (manual lap button)
        </p>
      )}
    </>
  );
};
