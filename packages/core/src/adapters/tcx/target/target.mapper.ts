import {
  targetTypeSchema,
  type TargetType,
} from "../../../domain/schemas/target";
import { tcxTargetTypeSchema } from "../schemas/tcx-target";

export const mapTargetType = (
  tcxTargetType: string | undefined
): TargetType => {
  if (tcxTargetType === tcxTargetTypeSchema.enum.HeartRate)
    return targetTypeSchema.enum.heart_rate;
  if (tcxTargetType === tcxTargetTypeSchema.enum.Speed)
    return targetTypeSchema.enum.pace;
  if (tcxTargetType === tcxTargetTypeSchema.enum.Cadence)
    return targetTypeSchema.enum.cadence;
  if (tcxTargetType === tcxTargetTypeSchema.enum.None)
    return targetTypeSchema.enum.open;
  return targetTypeSchema.enum.open;
};
