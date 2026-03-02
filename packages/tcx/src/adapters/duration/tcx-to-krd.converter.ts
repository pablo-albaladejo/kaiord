import { durationTypeSchema } from "@kaiord/core";
import { convertExtendedDuration } from "./extended-duration.converter";
import { convertStandardDuration } from "./standard-duration.converter";
import { tcxDurationTypeSchema } from "../schemas/tcx-duration";
import type {
  TcxDurationConversionResult,
  TcxDurationData,
} from "./standard-duration.converter";

export type {
  TcxDurationConversionResult,
  TcxDurationData,
  TcxDurationExtensions,
} from "./standard-duration.converter";

export const convertTcxDuration = (
  data: TcxDurationData
): TcxDurationConversionResult => {
  const result = tcxDurationTypeSchema.safeParse(data.durationType);

  if (!result.success) {
    return { duration: { type: durationTypeSchema.enum.open } };
  }

  const standardResult = convertStandardDuration(result.data, data);
  if (standardResult) return standardResult;

  const extendedResult = convertExtendedDuration(result.data, data);
  if (extendedResult) return extendedResult;

  return { duration: { type: durationTypeSchema.enum.open } };
};
