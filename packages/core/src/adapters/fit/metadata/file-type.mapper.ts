import { NUMBER_TO_FIT_FILE_TYPE } from "../schemas/fit-file-type";

/**
 * Maps FIT FILE_ID type number to KRD file type string
 *
 * Only workout, activity, and course types are supported in KRD.
 * Other FIT file types return undefined.
 */
export const mapFitFileTypeToKrd = (
  type: unknown
): "workout" | "activity" | "course" | undefined => {
  if (type === undefined) return undefined;

  const typeValue = typeof type === "number" ? type : undefined;
  if (typeValue === undefined) return undefined;

  const fitFileType = NUMBER_TO_FIT_FILE_TYPE[typeValue];
  if (
    fitFileType === "workout" ||
    fitFileType === "activity" ||
    fitFileType === "course"
  ) {
    return fitFileType;
  }

  return undefined;
};
