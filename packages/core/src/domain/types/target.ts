export enum TargetType {
  Power = "power",
  HeartRate = "heart_rate",
  Cadence = "cadence",
  Pace = "pace",
  Open = "open",
}

export type Target =
  | PowerTarget
  | HeartRateTarget
  | CadenceTarget
  | PaceTarget
  | { type: TargetType.Open };

export type PowerTarget = {
  type: TargetType.Power;
  value: PowerValue;
};

export type PowerValue =
  | { unit: "watts"; value: number }
  | { unit: "percent_ftp"; value: number }
  | { unit: "zone"; value: number }
  | { unit: "range"; min: number; max: number };

export type HeartRateTarget = {
  type: TargetType.HeartRate;
  value: HeartRateValue;
};

export type HeartRateValue =
  | { unit: "bpm"; value: number }
  | { unit: "zone"; value: number }
  | { unit: "percent_max"; value: number }
  | { unit: "range"; min: number; max: number };

export type CadenceTarget = {
  type: TargetType.Cadence;
  value: CadenceValue;
};

export type CadenceValue =
  | { unit: "rpm"; value: number }
  | { unit: "range"; min: number; max: number };

export type PaceTarget = {
  type: TargetType.Pace;
  value: PaceValue;
};

export type PaceValue =
  | { unit: "mps"; value: number }
  | { unit: "zone"; value: number }
  | { unit: "range"; min: number; max: number };
