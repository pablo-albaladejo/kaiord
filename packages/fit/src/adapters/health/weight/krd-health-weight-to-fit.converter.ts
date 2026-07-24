import type { KRD, Logger, WeightMeasurement } from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { buildHealthFileIdMessage } from "../shared/health-file-id.builder";
import { mapKrdWeightToFit } from "./health-weight.converter";

const HEALTH_WEIGHT_FILE_TYPE = "weight" as const;

const getWeightPayload = (krd: KRD): WeightMeasurement | undefined => {
  const extensions = krd.extensions as
    { health?: { weight?: WeightMeasurement } } | undefined;
  return extensions?.health?.weight;
};

/**
 * Maps a KRD `weight_measurement` to the raw FIT message list expected
 * by the FIT encoder (file_id + a single weight_scale message).
 */
export const convertKrdToFitHealthWeightMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown>[] => {
  const weight = getWeightPayload(krd);
  if (!weight) {
    logger.warn(
      "KRD weight_measurement without extensions.health.weight payload"
    );
    return [];
  }

  const fileIdMesg = buildHealthFileIdMessage(krd, HEALTH_WEIGHT_FILE_TYPE);

  const fitWeight = mapKrdWeightToFit(weight);
  const weightMesg = {
    mesgNum: FIT_MESSAGE_NUMBERS.WEIGHT_SCALE,
    timestamp: fitWeight.timestamp,
    weight: fitWeight.weight,
  };

  return [fileIdMesg, weightMesg];
};
