/**
 * Coordinate conversion utilities for FIT ↔ KRD.
 *
 * FIT uses semicircles for coordinates (signed 32-bit integer).
 * KRD uses degrees (-90 to 90 for lat, -180 to 180 for lon).
 */

const SEMICIRCLES_TO_DEGREES = 180 / Math.pow(2, 31);
const DEGREES_TO_SEMICIRCLES = Math.pow(2, 31) / 180;

/**
 * Converts FIT semicircles to degrees.
 * @param semicircles - Coordinate in semicircles (signed 32-bit integer)
 * @returns Coordinate in degrees
 */
export const semicirclesToDegrees = (semicircles: number): number =>
  semicircles * SEMICIRCLES_TO_DEGREES;

/**
 * Converts degrees to FIT semicircles.
 * @param degrees - Coordinate in degrees
 * @returns Coordinate in semicircles (rounded to integer)
 */
export const degreesToSemicircles = (degrees: number): number =>
  Math.round(degrees * DEGREES_TO_SEMICIRCLES);

/**
 * Validates that coordinates are within valid ranges.
 * Handles edge cases: NaN, Infinity.
 *
 * @param latSemicircles - Latitude in semicircles
 * @param lonSemicircles - Longitude in semicircles
 * @returns true if coordinates are valid
 */
export const validateCoordinates = (
  latSemicircles: number,
  lonSemicircles: number
): boolean => {
  if (!Number.isFinite(latSemicircles) || !Number.isFinite(lonSemicircles)) {
    return false;
  }

  const degreesLat = semicirclesToDegrees(latSemicircles);
  const degreesLon = semicirclesToDegrees(lonSemicircles);

  return (
    degreesLat >= -90 &&
    degreesLat <= 90 &&
    degreesLon >= -180 &&
    degreesLon <= 180
  );
};
