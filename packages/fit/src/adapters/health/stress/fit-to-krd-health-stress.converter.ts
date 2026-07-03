import type { KRD, Logger } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import type { FitMessages } from "../../shared/types";
import { buildHealthMetadata } from "../shared/health-metadata.builder";
import { type FitStressLevel, fitStressLevelSchema } from "./fit-stress.schema";
import { mapFitStressToKrd } from "./health-stress.converter";

const KRD_VERSION = "2.0" as const;

const parseSamples = (raw: unknown[], logger: Logger): FitStressLevel[] => {
  const out: FitStressLevel[] = [];
  for (const entry of raw) {
    const result = fitStressLevelSchema.safeParse(entry);
    if (result.success) {
      out.push(result.data);
      continue;
    }
    logger.warn("Skipping malformed stress_level message", {
      issues: result.error.issues,
    });
  }
  return out;
};

/**
 * Maps a FIT file carrying `stress_level` messages into a KRD
 * `stress_episode`. The KRD payload is a single aggregated window
 * (start/end/avg/peak); per-sample data is not preserved.
 */
export const convertFitToKrdHealthStress = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0] as
    Record<string, unknown> | undefined;
  const samples = parseSamples(
    messages[fitMessageKeySchema.enum.stressLevelMesgs] ?? [],
    logger
  );
  const stress = mapFitStressToKrd(samples);

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.stress_episode,
    metadata: buildHealthMetadata(fileId),
    extensions: stress ? { health: { stress } } : undefined,
  };
};
