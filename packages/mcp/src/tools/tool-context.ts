import type { KRD, Logger } from "@kaiord/core";
import type { FitWriterOptions } from "@kaiord/fit";

import type { FileFormat } from "../types/tool-schemas";
import { convertToKrd } from "./convert-to-krd";
import { assertStructuredWorkout } from "./structured-workout-gate";

export type ToolContext = {
  readonly logger: Logger;
  readonly remote: boolean;
  readonly fitWriter?: FitWriterOptions;
};

export const admitKrd = (context: ToolContext, krd: KRD): KRD =>
  context.remote ? assertStructuredWorkout(krd) : krd;

export const readAdmittedKrd = async (
  context: ToolContext,
  inputFile: string | undefined,
  inputContent: string | undefined,
  inputFormat: FileFormat | undefined
): Promise<KRD> => {
  const krd = await convertToKrd(
    inputFile,
    inputContent,
    inputFormat,
    context.logger
  );
  return admitKrd(context, krd);
};
