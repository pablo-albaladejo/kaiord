import type { KRD, Logger, StressEpisode } from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { mapKrdStressToFit } from "./health-stress.converter";

const HEALTH_STRESS_FILE_TYPE = "monitoringB" as const;

const getStressPayload = (krd: KRD): StressEpisode | undefined => {
  const extensions = krd.extensions as
    { health?: { stress?: StressEpisode } } | undefined;
  return extensions?.health?.stress;
};

/**
 * Maps a KRD `stress_episode` to the FIT message list expected by the
 * encoder (file_id + N `stress_level` messages). The KRD aggregate is
 * encoded as two samples — see `mapKrdStressToFit` for the lossiness
 * contract.
 */
export const convertKrdToFitHealthStressMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown>[] => {
  const stress = getStressPayload(krd);
  if (!stress) {
    logger.warn("KRD stress_episode without extensions.health.stress payload");
    return [];
  }

  const fileIdMesg: Record<string, unknown> = {
    mesgNum: FIT_MESSAGE_NUMBERS.FILE_ID,
    type: HEALTH_STRESS_FILE_TYPE,
    timeCreated: new Date(krd.metadata.created),
  };
  if (krd.metadata.manufacturer) {
    fileIdMesg.manufacturer = krd.metadata.manufacturer;
  }
  if (krd.metadata.product && /^\d+$/.test(krd.metadata.product)) {
    fileIdMesg.product = Number(krd.metadata.product);
  }

  const samples = mapKrdStressToFit(stress);
  const sampleMesgs = samples.map((s) => ({
    mesgNum: FIT_MESSAGE_NUMBERS.STRESS_LEVEL,
    stressLevelTime: s.stressLevelTime,
    stressLevelValue: s.stressLevelValue,
  }));

  return [fileIdMesg, ...sampleMesgs];
};
