import type { Target } from "../../../types/krd";

export type TargetPickerProps = {
  value: Target | null;
  onChange: (target: Target | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export type TargetTypeOption = {
  value: "power" | "heart_rate" | "pace" | "cadence" | "open";
  label: string;
};

export type TargetUnitOption = {
  value: string;
  label: string;
};
