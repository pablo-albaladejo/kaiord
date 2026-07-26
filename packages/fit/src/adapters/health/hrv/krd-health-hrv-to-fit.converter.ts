import type { HrvSummary, KRD, Logger } from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { buildHealthFileIdMessage } from "../shared/health-file-id.builder";
import { mapKrdHrvToFit } from "./health-hrv.converter";

const HEALTH_HRV_FILE_TYPE = "monitoringDaily" as const;

const getHrvPayload = (krd: KRD): HrvSummary | undefined => {
  const extensions = krd.extensions as
    { health?: { hrv?: HrvSummary } } | undefined;
  return extensions?.health?.hrv;
};

/**
 * Maps a KRD `hrv_summary` to the raw FIT message list expected by
 * the FIT encoder (file_id + a single hrv_status_summary). The KRD
 * summary lacks per-sample data, so no hrv_value messages are
 * emitted on the way out.
 */
export const convertKrdToFitHealthHrvMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown>[] => {
  const hrv = getHrvPayload(krd);
  if (!hrv) {
    logger.warn("KRD hrv_summary without extensions.health.hrv payload");
    return [];
  }

  const fileIdMesg = buildHealthFileIdMessage(krd, HEALTH_HRV_FILE_TYPE);

  const summary = mapKrdHrvToFit(hrv);
  const summaryMesg = {
    mesgNum: FIT_MESSAGE_NUMBERS.HRV_STATUS_SUMMARY,
    timestamp: summary.timestamp,
    lastNightAverage: summary.lastNightAverage,
    status: summary.status,
  };

  return [fileIdMesg, summaryMesg];
};
