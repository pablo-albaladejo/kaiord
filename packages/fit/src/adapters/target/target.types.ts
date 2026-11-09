import type { FitWorkoutStep } from "../shared/types";

export type FitTargetData = Pick<
  FitWorkoutStep,
  | "targetType"
  | "targetValue"
  | "targetPowerZone"
  | "targetHrZone"
  | "targetCadenceZone"
  | "targetSpeedZone"
  | "targetStrokeType"
  | "customTargetValueLow"
  | "customTargetValueHigh"
  | "customTargetPowerLow"
  | "customTargetPowerHigh"
  | "customTargetHeartRateLow"
  | "customTargetHeartRateHigh"
  | "customTargetCadenceLow"
  | "customTargetCadenceHigh"
  | "customTargetSpeedLow"
  | "customTargetSpeedHigh"
>;
