import { Profile } from "@garmin/fitsdk";
import { type Target, targetTypeSchema } from "@kaiord/core";
import { FIT_TO_SWIM_STROKE, targetUnitSchema } from "@kaiord/core";

import type { FitTargetData } from "./target.types";

// The SDK decoder resolves the `targetStrokeType` sub-field to its
// swim_stroke enum name ("breaststroke"); KRD stores the raw FIT number,
// limited to the codes its schema accepts (FIT codes above it read as open).
const toStrokeNumber = (stroke: number | string): number | undefined => {
  const entry = Object.entries(Profile.types.swimStroke).find(
    ([, name]) => name === stroke
  );
  const code = typeof stroke === "number" ? stroke : Number(entry?.[0]);
  return FIT_TO_SWIM_STROKE[code] === undefined ? undefined : code;
};

export const convertStrokeTypeTarget = (data: FitTargetData): Target => {
  const stroke =
    data.targetStrokeType === undefined
      ? undefined
      : toStrokeNumber(data.targetStrokeType);
  if (stroke !== undefined) {
    return {
      type: targetTypeSchema.enum.stroke_type,
      value: {
        unit: targetUnitSchema.enum.swim_stroke,
        value: stroke,
      },
    };
  }

  return { type: targetTypeSchema.enum.open };
};
