import type { KRDMetadata } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { mapSportType } from "../type-guards";
import type { FitFileId, FitWorkoutMessage } from "../types";

export const mapMetadata = (
  fileId: FitFileId | undefined,
  workoutMsg: FitWorkoutMessage | undefined,
  logger: Logger
): KRDMetadata => {
  logger.debug("Mapping metadata from FIT messages");

  const sport = mapSportType(workoutMsg?.sport);
  const created = mapCreatedTimestamp(fileId);

  return {
    created,
    manufacturer: fileId?.manufacturer,
    product: fileId?.garminProduct || fileId?.product?.toString(),
    serialNumber: fileId?.serialNumber?.toString(),
    sport,
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
