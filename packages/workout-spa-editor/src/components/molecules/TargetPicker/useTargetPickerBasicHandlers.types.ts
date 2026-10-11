import type { UseTargetPickerHandlersParams } from "./useTargetPickerHandlers.types";

export type BasicHandlersParams = Pick<
  UseTargetPickerHandlersParams,
  | "targetType"
  | "unit"
  | "paceBase"
  | "onChange"
  | "setTargetType"
  | "setValidationError"
  | "setUnit"
  | "setTargetValue"
  | "setMinValue"
  | "setMaxValue"
>;
