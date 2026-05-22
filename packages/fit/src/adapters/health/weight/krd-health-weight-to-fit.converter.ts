import type { KRD, Logger, WeightMeasurement } from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { mapKrdWeightToFit } from "./health-weight.converter";

const HEALTH_WEIGHT_FILE_TYPE = "weight" as const;

const getWeightPayload = (krd: KRD): WeightMeasurement | undefined => {
  const extensions = krd.extensions as
    | { health?: { weight?: WeightMeasurement } }
    | undefined;
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

  const fileIdMesg: Record<string, unknown> = {
    mesgNum: FIT_MESSAGE_NUMBERS.FILE_ID,
    type: HEALTH_WEIGHT_FILE_TYPE,
    timeCreated: new Date(krd.metadata.created),
  };
  if (krd.metadata.manufacturer) {
    fileIdMesg.manufacturer = krd.metadata.manufacturer;
  }
  if (krd.metadata.product && /^\d+$/.test(krd.metadata.product)) {
    fileIdMesg.product = Number(krd.metadata.product);
  }

  const fitWeight = mapKrdWeightToFit(weight);
  const weightMesg = {
    mesgNum: FIT_MESSAGE_NUMBERS.WEIGHT_SCALE,
    timestamp: fitWeight.timestamp,
    weight: fitWeight.weight,
  };

  return [fileIdMesg, weightMesg];
};
