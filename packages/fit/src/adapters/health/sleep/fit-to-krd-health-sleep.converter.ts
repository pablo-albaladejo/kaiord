import type { KRD, Logger } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import type { FitMessages } from "../../shared/types";
import {
  type FitSleepLevel,
  fitSleepLevelSchema,
} from "./fit-sleep-level.schema";
import { mapFitSleepLevelsToKrdSleep } from "./health-sleep.converter";

const KRD_VERSION = "2.0" as const;

const convertTimeCreated = (timeCreated: unknown): string => {
  if (timeCreated instanceof Date) return timeCreated.toISOString();
  if (typeof timeCreated === "number")
    return new Date(timeCreated * 1000).toISOString();
  return new Date().toISOString();
};

const parseSleepLevels = (raw: unknown[], logger: Logger): FitSleepLevel[] => {
  const parsed: FitSleepLevel[] = [];
  for (const entry of raw) {
    const result = fitSleepLevelSchema.safeParse(entry);
    if (result.success) {
      parsed.push(result.data);
    } else {
      logger.warn("Skipping malformed sleep_level message", {
        issues: result.error.issues,
      });
    }
  }
  return parsed;
};

/**
 * Maps a FIT sleep file (file_type 49 or any file containing
 * `sleep_level` messages) to a KRD `sleep_record` with the sleep
 * payload under `extensions.health.sleep`.
 */
export const convertFitToKrdHealthSleep = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0] as
    | Record<string, unknown>
    | undefined;
  const rawLevels = messages[fitMessageKeySchema.enum.sleepLevelMesgs] ?? [];
  const fitLevels = parseSleepLevels(rawLevels, logger);
  const sleep = mapFitSleepLevelsToKrdSleep(fitLevels);

  const metadata = {
    created: convertTimeCreated(fileId?.timeCreated),
    manufacturer:
      typeof fileId?.manufacturer === "string"
        ? fileId.manufacturer
        : undefined,
    product:
      typeof fileId?.product === "number" ? String(fileId.product) : undefined,
  };

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.sleep_record,
    metadata,
    extensions: sleep ? { health: { sleep } } : undefined,
  };
};
