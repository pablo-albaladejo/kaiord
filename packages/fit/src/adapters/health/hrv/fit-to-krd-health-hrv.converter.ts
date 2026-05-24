import type { KRD, Logger } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import type { FitMessages } from "../../shared/types";
import { buildHealthMetadata } from "../shared/health-metadata.builder";
import {
  type FitHrvStatusSummary,
  fitHrvStatusSummarySchema,
  type FitHrvValue,
  fitHrvValueSchema,
} from "./fit-hrv.schema";
import { mapFitHrvToKrd } from "./health-hrv.converter";

const KRD_VERSION = "2.0" as const;

const parseFirstSummary = (
  raw: unknown[],
  logger: Logger
): FitHrvStatusSummary | undefined => {
  for (const entry of raw) {
    const result = fitHrvStatusSummarySchema.safeParse(entry);
    if (result.success) return result.data;
    logger.warn("Skipping malformed hrv_status_summary message", {
      issues: result.error.issues,
    });
  }
  return undefined;
};

const parseFirstValue = (
  raw: unknown[],
  logger: Logger
): FitHrvValue | undefined => {
  for (const entry of raw) {
    const result = fitHrvValueSchema.safeParse(entry);
    if (result.success) return result.data;
    logger.warn("Skipping malformed hrv_value message", {
      issues: result.error.issues,
    });
  }
  return undefined;
};

/**
 * Maps a FIT file carrying HRV messages (hrv_status_summary or
 * hrv_value) to a KRD `hrv_summary`. The KRD payload is a single
 * summary, not a time-series — per-sample hrv_value messages beyond
 * the first are not preserved in v2.0.
 */
export const convertFitToKrdHealthHrv = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0] as
    | Record<string, unknown>
    | undefined;
  const summary = parseFirstSummary(
    messages[fitMessageKeySchema.enum.hrvStatusSummaryMesgs] ?? [],
    logger
  );
  const firstValue = parseFirstValue(
    messages[fitMessageKeySchema.enum.hrvValueMesgs] ?? [],
    logger
  );
  const hrv = mapFitHrvToKrd(summary, firstValue);

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.hrv_summary,
    metadata: buildHealthMetadata(fileId),
    extensions: hrv ? { health: { hrv } } : undefined,
  };
};
