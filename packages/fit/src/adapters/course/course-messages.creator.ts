import { mapKrdCoursePointToFit } from "./course.mapper";
import { convertMetadataToFileId } from "../krd-to-fit/krd-to-fit-metadata.mapper";
import type { KRDCoursePoint } from "./course.mapper";
import type { KRD, Logger } from "@kaiord/core";

type CourseExtensions = {
  course?: unknown;
  course_points?: KRDCoursePoint[];
};

const addOptionalMessages = (
  messages: Record<string, unknown[]>,
  krd: KRD,
  extensions: CourseExtensions | undefined
): void => {
  if (extensions?.course) {
    messages.courseMesgs = [extensions.course];
  }
  if (extensions?.course_points) {
    messages.coursePointMesgs = extensions.course_points.map(
      mapKrdCoursePointToFit
    );
  }
  if (krd.records && krd.records.length > 0) {
    messages.recordMesgs = krd.records;
  }
  if (krd.laps && krd.laps.length > 0) {
    messages.lapMesgs = krd.laps;
  }
};

const logCourseMessages = (
  messages: Record<string, unknown[]>,
  logger: Logger
): void => {
  const coursePoints = messages.coursePointMesgs
    ? messages.coursePointMesgs.length
    : 0;
  const records = messages.recordMesgs ? messages.recordMesgs.length : 0;
  const laps = messages.lapMesgs ? messages.lapMesgs.length : 0;
  logger.debug("Created course messages", { coursePoints, records, laps });
};

/**
 * Creates FIT course messages from KRD format
 *
 * Course files contain route/navigation data with waypoints.
 * This function generates the appropriate message structure for course files.
 */
export const createCourseMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown[]> => {
  logger.debug("Creating course messages from KRD");

  const messages: Record<string, unknown[]> = {
    fileIdMesgs: [convertMetadataToFileId(krd, logger)],
  };

  const extensions = krd.extensions as CourseExtensions | undefined;
  addOptionalMessages(messages, krd, extensions);
  logCourseMessages(messages, logger);

  return messages;
};
