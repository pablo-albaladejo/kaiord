import type { DailyWellness, KRD, Logger } from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { buildHealthFileIdMessage } from "../shared/health-file-id.builder";
import { mapKrdDailyToFit } from "./health-daily.converter";

const HEALTH_DAILY_FILE_TYPE = "monitoringB" as const;

const getDailyPayload = (krd: KRD): DailyWellness | undefined => {
  const extensions = krd.extensions as
    { health?: { daily?: DailyWellness } } | undefined;
  return extensions?.health?.daily;
};

/**
 * Maps a KRD `daily_wellness` to the FIT message list expected by the
 * encoder (file_id + monitoring_info + one summary monitoring).
 */
export const convertKrdToFitHealthDailyMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown>[] => {
  const daily = getDailyPayload(krd);
  if (!daily) {
    logger.warn("KRD daily_wellness without extensions.health.daily payload");
    return [];
  }

  const fileIdMesg = buildHealthFileIdMessage(krd, HEALTH_DAILY_FILE_TYPE);

  const { info, summary } = mapKrdDailyToFit(daily);
  const infoMesg = {
    mesgNum: FIT_MESSAGE_NUMBERS.MONITORING_INFO,
    timestamp: info.timestamp,
    restingMetabolicRate: info.restingMetabolicRate,
  };
  const summaryMesg = {
    mesgNum: FIT_MESSAGE_NUMBERS.MONITORING,
    timestamp: summary.timestamp,
    steps: summary.steps,
    activeCalories: summary.activeCalories,
    durationMin: summary.durationMin,
  };

  return [fileIdMesg, infoMesg, summaryMesg];
};
