import type { KRD, Logger } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import type { FitMessages } from "../../shared/types";
import { buildHealthMetadata } from "../shared/health-metadata.builder";
import {
  type FitBodyComposition,
  fitBodyCompositionSchema,
} from "./fit-body-composition.schema";
import { mapFitBodyCompositionToKrd } from "./health-body-composition.converter";

const KRD_VERSION = "2.0" as const;

const parseFirstBodyComposition = (
  raw: unknown[],
  logger: Logger
): FitBodyComposition | undefined => {
  for (const entry of raw) {
    const result = fitBodyCompositionSchema.safeParse(entry);
    if (result.success) return result.data;
    logger.warn("Skipping malformed body_composition message", {
      issues: result.error.issues,
    });
  }
  return undefined;
};

/**
 * Maps a FIT file carrying `body_composition` messages to a KRD
 * `body_composition`. When the FIT contains multiple body composition
 * messages (e.g. a multi-user scale dump), only the first valid one
 * is mapped — the rest are dropped silently. Per-user fan-out is out
 * of scope for v2.0.
 */
export const convertFitToKrdHealthBodyComposition = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0] as
    Record<string, unknown> | undefined;
  const rawBody = messages[fitMessageKeySchema.enum.bodyCompositionMesgs] ?? [];
  const fitBody = parseFirstBodyComposition(rawBody, logger);
  const body = fitBody ? mapFitBodyCompositionToKrd(fitBody) : undefined;

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.body_composition,
    metadata: buildHealthMetadata(fileId),
    extensions: body ? { health: { bodyComposition: body } } : undefined,
  };
};
