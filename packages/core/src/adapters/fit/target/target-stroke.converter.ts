import {
  targetTypeEnum,
  targetUnitEnum,
  type Target,
} from "../../../domain/schemas/target";
import type { FitTargetData } from "./target.types";

export const convertStrokeTypeTarget = (data: FitTargetData): Target => {
  if (data.targetSwimStroke !== undefined) {
    return {
      type: targetTypeEnum.enum.stroke_type,
      value: {
        unit: targetUnitEnum.enum.swim_stroke,
        value: data.targetSwimStroke,
      },
    };
  }

  return { type: targetTypeEnum.enum.open };
};
