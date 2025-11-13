import {
  targetTypeSchema,
  targetUnitSchema,
  type Target,
} from "../../../domain/schemas/target";
import type { FitTargetData } from "./target.types";

export const convertStrokeTypeTarget = (data: FitTargetData): Target => {
  if (data.targetSwimStroke !== undefined) {
    return {
      type: targetTypeSchema.enum.stroke_type,
      value: {
        unit: targetUnitSchema.enum.swim_stroke,
        value: data.targetSwimStroke,
      },
    };
  }

  return { type: targetTypeSchema.enum.open };
};
