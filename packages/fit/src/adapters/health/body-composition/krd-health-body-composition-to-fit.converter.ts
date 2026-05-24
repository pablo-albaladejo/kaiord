import type { BodyComposition, KRD, Logger } from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { mapKrdBodyCompositionToFit } from "./health-body-composition.converter";

const HEALTH_BODY_COMPOSITION_FILE_TYPE = "weight" as const;

const getBodyCompositionPayload = (krd: KRD): BodyComposition | undefined => {
  const extensions = krd.extensions as
    | { health?: { bodyComposition?: BodyComposition } }
    | undefined;
  return extensions?.health?.bodyComposition;
};

/**
 * Maps a KRD `body_composition` to the FIT message list expected by
 * the encoder (file_id + body_composition message). Garmin reuses the
 * `weight` file_type for body-composition-only files.
 */
export const convertKrdToFitHealthBodyCompositionMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown>[] => {
  const body = getBodyCompositionPayload(krd);
  if (!body) {
    logger.warn(
      "KRD body_composition without extensions.health.bodyComposition payload"
    );
    return [];
  }

  const fileIdMesg: Record<string, unknown> = {
    mesgNum: FIT_MESSAGE_NUMBERS.FILE_ID,
    type: HEALTH_BODY_COMPOSITION_FILE_TYPE,
    timeCreated: new Date(krd.metadata.created),
  };
  if (krd.metadata.manufacturer) {
    fileIdMesg.manufacturer = krd.metadata.manufacturer;
  }
  if (krd.metadata.product && /^\d+$/.test(krd.metadata.product)) {
    fileIdMesg.product = Number(krd.metadata.product);
  }

  const fit = mapKrdBodyCompositionToFit(body);
  const bodyMesg: Record<string, unknown> = {
    mesgNum: FIT_MESSAGE_NUMBERS.BODY_COMPOSITION,
    timestamp: fit.timestamp,
  };
  for (const [key, value] of Object.entries(fit)) {
    if (key !== "timestamp" && value !== undefined) bodyMesg[key] = value;
  }

  return [fileIdMesg, bodyMesg];
};
