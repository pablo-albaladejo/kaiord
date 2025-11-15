import { Input } from "../../atoms/Input/Input";
import type { DurationTypeOption } from "./DurationPicker.types";

const DURATION_TYPE_OPTIONS: Array<DurationTypeOption> = [
  { value: "time", label: "Time" },
  { value: "distance", label: "Distance" },
  { value: "open", label: "Open" },
];

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
      <Input
        variant="select"
        label="Duration Type"
        value={durationType}
        onChange={onTypeChange}
        disabled={disabled}
        options={DURATION_TYPE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        aria-label="Select duration type"
      />

      {durationType !== "open" && (
        <Input
          variant="number"
          label={getValueLabel(durationType)}
          value={durationValue}
          onChange={onValueChange}
          disabled={disabled}
          error={displayError}
          placeholder={getValuePlaceholder(durationType)}
          min="0"
          step={durationType === "time" ? "1" : "0.01"}
          aria-label={getValueLabel(durationType)}
          aria-invalid={Boolean(displayError)}
          aria-describedby={displayError ? "duration-error" : undefined}
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
