import { targetTypeSchema, type Target } from "../../../domain/schemas/target";
import { targetUnitSchema } from "../../../domain/schemas/target-values";
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
