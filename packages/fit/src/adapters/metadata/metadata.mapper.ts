import type { KRDMetadata } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { mapSportType } from "../shared/type-guards";
import type { FitFileId, FitWorkoutMessage } from "../shared/types";
import { mapFitFileTypeToKrd } from "./file-type.mapper";

export const mapMetadata = (
  fileId: FitFileId | undefined,
  workoutMsg: FitWorkoutMessage | undefined,
  logger: Logger
): KRDMetadata => {
  logger.debug("Mapping metadata from FIT messages");

  const sport = mapSportType(workoutMsg?.sport);
  const created = mapCreatedTimestamp(fileId);
  const fileType = mapFitFileTypeToKrd(fileId?.type);

  return {
    created,
    manufacturer: fileId?.manufacturer,
    product: fileId?.garminProduct || fileId?.product?.toString(),
    serialNumber: fileId?.serialNumber?.toString(),
    sport,
    fileType,
  };
};

const mapCreatedTimestamp = (fileId: FitFileId | undefined): string => {
  if (!fileId?.timeCreated) {
    return new Date().toISOString();
  }

  if (typeof fileId.timeCreated === "string") {
    return fileId.timeCreated;
  }

  if (fileId.timeCreated instanceof Date) {
    return fileId.timeCreated.toISOString();
  }

  return new Date().toISOString();
};
