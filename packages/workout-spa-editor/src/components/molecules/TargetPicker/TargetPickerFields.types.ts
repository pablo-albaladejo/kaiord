export type TargetPickerFieldsProps = {
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open";
  unit: string;
  targetValue: string;
  minValue: string;
  maxValue: string;
  displayError: string;
  disabled: boolean;
  unitOptions: Array<{ value: string; label: string }>;
  onTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onUnitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getValueLabel: (
    type: "power" | "heart_rate" | "pace" | "cadence" | "open",
    unit: string
  ) => string;
  getValuePlaceholder: (
    type: "power" | "heart_rate" | "pace" | "cadence" | "open",
    unit: string
  ) => string;
};
