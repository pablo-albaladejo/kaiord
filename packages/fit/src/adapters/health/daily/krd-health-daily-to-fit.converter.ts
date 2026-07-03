import type { DailyWellness, KRD, Logger } from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
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

  const fileIdMesg: Record<string, unknown> = {
    mesgNum: FIT_MESSAGE_NUMBERS.FILE_ID,
    type: HEALTH_DAILY_FILE_TYPE,
    timeCreated: new Date(krd.metadata.created),
  };
  if (krd.metadata.manufacturer) {
    fileIdMesg.manufacturer = krd.metadata.manufacturer;
  }
  if (krd.metadata.product && /^\d+$/.test(krd.metadata.product)) {
    fileIdMesg.product = Number(krd.metadata.product);
  }

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
