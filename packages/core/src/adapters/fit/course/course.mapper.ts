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

