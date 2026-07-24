import type { KRD, Logger, SleepRecord } from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { buildHealthFileIdMessage } from "../shared/health-file-id.builder";
import { mapKrdSleepToFitSleepLevels } from "./health-sleep.converter";

const HEALTH_SLEEP_FILE_TYPE = "sleep" as const;

const getSleepPayload = (krd: KRD): SleepRecord | undefined => {
  const extensions = krd.extensions as
    { health?: { sleep?: SleepRecord } } | undefined;
  return extensions?.health?.sleep;
};

/**
 * Maps a KRD `sleep_record` to the raw FIT message list expected by
 * the FIT encoder (file_id + sleep_level transitions).
 *
 * Returns an empty list (no fileId, no transitions) when the KRD
 * carries no `extensions.health.sleep` payload — the caller decides
 * whether that is an error.
 */
export const convertKrdToFitHealthSleepMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown>[] => {
  const sleep = getSleepPayload(krd);
  if (!sleep) {
    logger.warn("KRD sleep_record without extensions.health.sleep payload");
    return [];
  }

  const fileIdMesg = buildHealthFileIdMessage(krd, HEALTH_SLEEP_FILE_TYPE);

  const transitions = mapKrdSleepToFitSleepLevels(sleep).map((level) => ({
    mesgNum: FIT_MESSAGE_NUMBERS.SLEEP_LEVEL,
    timestamp: level.timestamp,
    sleepLevel: level.sleepLevel,
  }));

  return [fileIdMesg, ...transitions];
};
