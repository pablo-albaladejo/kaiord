import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { convertMetadataToFileId } from "../krd-to-fit/krd-to-fit-metadata.mapper";
import type { FitCoursePoint } from "../schemas/fit-course-point";
import {
  degreesToSemicircles,
  semicirclesToDegrees,
} from "../shared/coordinate.converter";

/**
 * Course point type for KRD extensions
 */
export type KRDCoursePoint = {
  index?: number;
  latitude: number;
  longitude: number;
  distance?: number;
  type: string;
  name?: string;
  favorite?: boolean;
  timestamp?: string;
};

/**
 * Maps FIT course point to KRD format
 *
 * Converts FIT course point with semicircles coordinates
 * to KRD format with decimal degrees.
 */
export const mapFitCoursePointToKrd = (
  point: FitCoursePoint
): KRDCoursePoint => ({
  latitude: semicirclesToDegrees(point.positionLat),
  longitude: semicirclesToDegrees(point.positionLong),
  distance: point.distance,
  type: point.type,
  name: point.name,
  favorite: point.favorite,
  timestamp: point.timestamp
    ? new Date(point.timestamp * 1000).toISOString()
    : undefined,
});

/**
 * Maps KRD course point to FIT format
 *
 * Converts KRD course point with decimal degrees
 * to FIT format with semicircles coordinates.
 */
export const mapKrdCoursePointToFit = (
  point: KRDCoursePoint
): FitCoursePoint => ({
  messageIndex: point.index,
  positionLat: degreesToSemicircles(point.latitude),
  positionLong: degreesToSemicircles(point.longitude),
  distance: point.distance,
  type: point.type as FitCoursePoint["type"],
  name: point.name,
  favorite: point.favorite,
  timestamp: point.timestamp
    ? Math.floor(new Date(point.timestamp).getTime() / 1000)
    : undefined,
});

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
        activity?: {
          records?: unknown[];
          laps?: unknown[];
        };
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
  if (extensions?.activity?.records) {
    messages.recordMesgs = extensions.activity.records;
  }

  // Add lap messages if present (course segments)
  if (extensions?.activity?.laps) {
    messages.lapMesgs = extensions.activity.laps;
  }

  logger.debug("Created course messages", {
    coursePoints: messages.coursePointMesgs?.length ?? 0,
    records: messages.recordMesgs?.length ?? 0,
    laps: messages.lapMesgs?.length ?? 0,
  });

  return messages;
};
