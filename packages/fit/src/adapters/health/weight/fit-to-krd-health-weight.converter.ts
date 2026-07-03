import type { KRD, Logger } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import type { FitMessages } from "../../shared/types";
import { buildHealthMetadata } from "../shared/health-metadata.builder";
import {
  type FitWeightScale,
  fitWeightScaleSchema,
} from "./fit-weight-scale.schema";
import { mapFitWeightScaleToKrd } from "./health-weight.converter";

const KRD_VERSION = "2.0" as const;

const parseFirstWeight = (
  raw: unknown[],
  logger: Logger
): FitWeightScale | undefined => {
  for (const entry of raw) {
    const result = fitWeightScaleSchema.safeParse(entry);
    if (result.success) return result.data;
    logger.warn("Skipping malformed weight_scale message", {
      issues: result.error.issues,
    });
  }
  return undefined;
};

/**
 * Maps a FIT weight file (file_type 9) to a KRD `weight_measurement`
 * with the scalar weight payload under `extensions.health.weight`.
 *
 * When the FIT carries multiple weight_scale messages (multi-user
 * scale), only the first valid one is mapped — the remaining
 * measurements are dropped with a warning. Per-user fan-out is out
 * of scope for the v2.0 single-KRD-per-file contract.
 */
export const convertFitToKrdHealthWeight = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0] as
    Record<string, unknown> | undefined;
  const rawWeights = messages[fitMessageKeySchema.enum.weightScaleMesgs] ?? [];
  if (rawWeights.length > 1) {
    logger.warn("Multiple weight_scale messages — keeping the first only", {
      count: rawWeights.length,
    });
  }
  const fitWeight = parseFirstWeight(rawWeights, logger);
  const weight = fitWeight ? mapFitWeightScaleToKrd(fitWeight) : undefined;

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.weight_measurement,
    metadata: buildHealthMetadata(fileId),
    extensions: weight ? { health: { weight } } : undefined,
  };
};
