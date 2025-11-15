/**
 * Format Helper Functions for WorkoutStats
 *
 * Utilities for formatting duration and distance values.
 */

/**
 * Format duration in seconds to human-readable format (HH:MM:SS or MM:SS)
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Format distance in meters to human-readable format
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
};
