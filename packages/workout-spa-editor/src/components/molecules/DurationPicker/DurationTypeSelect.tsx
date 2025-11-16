import { Input } from "../../atoms/Input/Input";
import type { DurationTypeOption } from "./DurationPicker.types";

const DURATION_TYPE_OPTIONS: Array<DurationTypeOption> = [
  { value: "time", label: "Time" },
  { value: "distance", label: "Distance" },
  { value: "open", label: "Open" },
];

type DurationTypeSelectProps = {
  value: "time" | "distance" | "open";
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
};

export function DurationTypeSelect({
  value,
  onChange,
  disabled,
}: DurationTypeSelectProps) {
  return (
    <Input
      variant="select"
      label="Duration Type"
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={DURATION_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      }))}
      aria-label="Select duration type"
    />
  );
}
