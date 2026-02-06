import type { KRDMetadata } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { NUMBER_TO_FIT_FILE_TYPE } from "../schemas/fit-file-type";
import { mapSportType } from "../shared/type-guards";
import type { FitFileId, FitWorkoutMessage } from "../shared/types";

export const mapMetadata = (
  fileId: FitFileId | undefined,
  workoutMsg: FitWorkoutMessage | undefined,
  logger: Logger
): KRDMetadata => {
  logger.debug("Mapping metadata from FIT messages");

  const sport = mapSportType(workoutMsg?.sport);
  const created = mapCreatedTimestamp(fileId);

  // Map FIT file type to KRD file type (only workout, activity, course are supported)
  let fileType: "workout" | "activity" | "course" | undefined;
  if (fileId?.type !== undefined) {
    const typeValue = typeof fileId.type === "number" ? fileId.type : undefined;
    if (typeValue !== undefined) {
      const fitFileType = NUMBER_TO_FIT_FILE_TYPE[typeValue];
      if (
        fitFileType === "workout" ||
        fitFileType === "activity" ||
        fitFileType === "course"
      ) {
        fileType = fitFileType;
      }
    }
  }

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
