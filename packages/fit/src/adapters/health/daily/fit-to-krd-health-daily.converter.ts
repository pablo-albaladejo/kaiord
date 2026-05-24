import type { KRD, Logger } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import type { FitMessages } from "../../shared/types";
import { buildHealthMetadata } from "../shared/health-metadata.builder";
import {
  type FitMonitoring,
  type FitMonitoringInfo,
  fitMonitoringInfoSchema,
  fitMonitoringSchema,
} from "./fit-monitoring.schema";
import { mapFitMonitoringToKrdDaily } from "./health-daily.converter";

const KRD_VERSION = "2.0" as const;

const parseMonitoringInfo = (
  raw: unknown[],
  logger: Logger
): FitMonitoringInfo | undefined => {
  for (const entry of raw) {
    const result = fitMonitoringInfoSchema.safeParse(entry);
    if (result.success) return result.data;
    logger.warn("Skipping malformed monitoring_info message", {
      issues: result.error.issues,
    });
  }
  return undefined;
};

const parseMonitoring = (raw: unknown[], logger: Logger): FitMonitoring[] => {
  const parsed: FitMonitoring[] = [];
  for (const entry of raw) {
    const result = fitMonitoringSchema.safeParse(entry);
    if (result.success) parsed.push(result.data);
    else
      logger.warn("Skipping malformed monitoring message", {
        issues: result.error.issues,
      });
  }
  return parsed;
};

/**
 * Maps a FIT monitoring file (file_type monitoringA/B/Daily) to a KRD
 * `daily_wellness`. Steps and active calories are summed across all
 * monitoring messages; resting calories come from monitoring_info.
 */
export const convertFitToKrdHealthDaily = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0] as
    | Record<string, unknown>
    | undefined;
  const info = parseMonitoringInfo(
    messages[fitMessageKeySchema.enum.monitoringInfoMesgs] ?? [],
    logger
  );
  const monitoring = parseMonitoring(
    messages[fitMessageKeySchema.enum.monitoringMesgs] ?? [],
    logger
  );
  const daily = mapFitMonitoringToKrdDaily(info, monitoring);

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.daily_wellness,
    metadata: buildHealthMetadata(fileId),
    extensions: daily ? { health: { daily } } : undefined,
  };
};
