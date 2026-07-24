import type {
  BodyComposition,
  KRD,
  Logger,
  WeightMeasurement,
} from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { buildHealthFileIdMessage } from "../shared/health-file-id.builder";
import type { FitWeightScale } from "../weight/fit-weight-scale.schema";
import { mapKrdWeightToFit } from "../weight/health-weight.converter";
import type { FitBodyComposition } from "./fit-body-composition.schema";
import { mapKrdBodyCompositionToFit } from "./health-body-composition.converter";

const HEALTH_WEIGHT_FILE_TYPE = "weight" as const;

const getHealth = (
  krd: KRD
):
  | { weight?: WeightMeasurement; bodyComposition?: BodyComposition }
  | undefined =>
  (
    krd.extensions as
      | {
          health?: {
            weight?: WeightMeasurement;
            bodyComposition?: BodyComposition;
          };
        }
      | undefined
  )?.health;

const buildWeightScaleMesg = (
  fitWeight: FitWeightScale | undefined,
  fitBody: FitBodyComposition | undefined
): Record<string, unknown> => {
  const weightScaleMesg: Record<string, unknown> = {
    mesgNum: FIT_MESSAGE_NUMBERS.WEIGHT_SCALE,
    timestamp: fitWeight?.timestamp ?? fitBody?.timestamp,
  };
  if (fitWeight) {
    weightScaleMesg.weight = fitWeight.weight;
  }
  for (const [key, value] of Object.entries(fitBody ?? {})) {
    if (key !== "timestamp" && value !== undefined) {
      weightScaleMesg[key] = value;
    }
  }
  return weightScaleMesg;
};

/**
 * Builds the ENCODABLE FIT message list for a Garmin body-composition upload:
 * a `file_id` plus a SINGLE `weight_scale` (mesgNum 30) message carrying the
 * weight and every body-composition field.
 *
 * `weight_scale` is used instead of `body_composition` (mesgNum 41) because
 * @garmin/fitsdk v21.208.0 has NO mesgNum 41 in its Profile, so a real
 * `Encoder` THROWS on it ("Could not write Message"). `weight_scale` carries
 * the same composition fields (percentFat, percentHydration, visceralFatRating,
 * boneMass, muscleMass, basalMet, bmi) and encodes to real bytes. All values
 * are REAL kilograms/percent/kcal: the SDK auto-applies the FIT profile scale
 * on encode, so the field mappers must not pre-scale.
 */
export const convertKrdToWeightScaleUploadMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown>[] => {
  const health = getHealth(krd);
  const weight = health?.weight;
  const body = health?.bodyComposition;
  if (!weight && !body) {
    logger.warn(
      "KRD upload without extensions.health.weight or bodyComposition payload"
    );
    return [];
  }

  const fitWeight = weight ? mapKrdWeightToFit(weight) : undefined;
  const fitBody = body ? mapKrdBodyCompositionToFit(body) : undefined;

  return [
    buildHealthFileIdMessage(krd, HEALTH_WEIGHT_FILE_TYPE),
    buildWeightScaleMesg(fitWeight, fitBody),
  ];
};
