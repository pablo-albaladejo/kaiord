import { type Target, targetTypeSchema } from "@kaiord/core";

import { tcxTargetTypeSchema } from "../schemas/tcx-target";
import {
  convertCadenceTarget,
  convertHeartRateTarget,
  convertSpeedTarget,
} from "./tcx-to-krd-target.helpers";
import type { TcxTargetData } from "./tcx-to-krd-target.types";

export type { TcxTargetData } from "./tcx-to-krd-target.types";

export const convertTcxTarget = (data: TcxTargetData): Target => {
  if (data.targetType === tcxTargetTypeSchema.enum.HeartRate) {
    return convertHeartRateTarget(data);
  }

  if (data.targetType === tcxTargetTypeSchema.enum.Speed) {
    return convertSpeedTarget(data);
  }

  if (data.targetType === tcxTargetTypeSchema.enum.Cadence) {
    return convertCadenceTarget(data);
  }

  return { type: targetTypeSchema.enum.open };
};
