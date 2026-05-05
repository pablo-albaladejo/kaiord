import type { KRD } from "@kaiord/core";
import type { Workout } from "@kaiord/core";
import type { Logger } from "@kaiord/core";

import type { FitFileType } from "../schemas/fit-file-type";
import { FIT_FILE_TYPE_TO_NUMBER } from "../schemas/fit-file-type";
import { mapSubSportToFit } from "../sub-sport/sub-sport.mapper";
import { mapManufacturer } from "./krd-to-fit-manufacturer.mapper";
import { countValidSteps } from "./krd-to-fit-step-count.helpers";

const resolveFitFileType = (krdType: KRD["type"]): FitFileType => {
  if (krdType === "structured_workout") return "workout";
  if (krdType === "recorded_activity") return "activity";
  if (krdType === "course") return "course";
  return "workout";
};

const assignParsedNumber = (
  target: Record<string, unknown>,
  key: string,
  raw: string
): void => {
  const parsed = parseInt(raw, 10);
  if (!isNaN(parsed)) {
    target[key] = parsed;
  }
};

export const convertMetadataToFileId = (
  krd: KRD,
  logger: Logger
): Record<string, unknown> => {
  logger.debug("Converting metadata to file_id message");

  const fileType = resolveFitFileType(krd.type);

  const fileId: Record<string, unknown> = {
    type: FIT_FILE_TYPE_TO_NUMBER[fileType],
    timeCreated: new Date(krd.metadata.created),
    manufacturer: mapManufacturer(krd.metadata.manufacturer, logger),
  };

  if (krd.metadata.product !== undefined) {
    assignParsedNumber(fileId, "product", krd.metadata.product);
  }

  if (krd.metadata.serialNumber) {
    assignParsedNumber(fileId, "serialNumber", krd.metadata.serialNumber);
  }

  return fileId;
};

export const convertWorkoutMetadata = (
  workout: Workout,
  logger: Logger
): Record<string, unknown> => {
  logger.debug("Converting workout metadata");

  const numValidSteps = countValidSteps(workout.steps);

  const workoutMesg: Record<string, unknown> = {
    wktName: workout.name,
    sport: workout.sport,
    numValidSteps,
  };

  if (workout.subSport !== undefined) {
    workoutMesg.subSport = mapSubSportToFit(workout.subSport);
  }

  if (workout.poolLength !== undefined) {
    workoutMesg.poolLength = workout.poolLength;
    workoutMesg.poolLengthUnit = 0;
  }

  return workoutMesg;
};
