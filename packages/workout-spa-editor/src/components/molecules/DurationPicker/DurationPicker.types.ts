import type { Duration } from "../../../types/krd";

export type DurationPickerProps = {
  value: Duration | null;
  onChange: (duration: Duration | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export type DurationTypeOption = {
  value: "time" | "distance" | "open";
  label: string;
};
