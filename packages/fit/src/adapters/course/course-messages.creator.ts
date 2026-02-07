import type { KRD } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { convertMetadataToFileId } from "../krd-to-fit/krd-to-fit-metadata.mapper";
import type { KRDCoursePoint } from "./course.mapper";
import { mapKrdCoursePointToFit } from "./course.mapper";

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

  const extensions = krd.extensions as
    | {
        course?: unknown;
        course_points?: KRDCoursePoint[];
      }
    | undefined;

  // Add course message if present
  if (extensions?.course) {
    messages.courseMesgs = [extensions.course];
  }

  // Add course point messages if present
  if (extensions?.course_points) {
    messages.coursePointMesgs = extensions.course_points.map(
      mapKrdCoursePointToFit
    );
  }

  // Add record messages if present (route track)
  if (krd.records && krd.records.length > 0) {
    messages.recordMesgs = krd.records;
  }

  // Add lap messages if present (course segments)
  if (krd.laps && krd.laps.length > 0) {
    messages.lapMesgs = krd.laps;
  }

  logger.debug("Created course messages", {
    coursePoints: messages.coursePointMesgs?.length ?? 0,
    records: messages.recordMesgs?.length ?? 0,
    laps: messages.lapMesgs?.length ?? 0,
  });

  return messages;
};
