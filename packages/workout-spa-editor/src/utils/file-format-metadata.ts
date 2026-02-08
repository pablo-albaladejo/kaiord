/**
 * File Format Metadata
 *
 * Provides metadata and descriptions for workout file formats.
 */

import type { WorkoutFileFormat } from "./file-format-detector";

/**
 * Gets the file extension for a given workout file format.
 *
 * @param format - The workout file format
 * @returns The file extension (without dot)
 */
export const getFileExtension = (format: WorkoutFileFormat): string => {
  return format;
};

/**
 * Gets a human-readable format name.
 *
 * @param format - The workout file format
 * @returns The human-readable format name
 */
export const getFormatName = (format: WorkoutFileFormat): string => {
  switch (format) {
    case "fit":
      return "FIT";
    case "tcx":
      return "TCX";
    case "zwo":
      return "ZWO";
    case "krd":
      return "KRD";
    case "gcn":
      return "GCN";
  }
};

/**
 * Gets a description of the format and its compatibility.
 *
 * @param format - The workout file format
 * @returns Format description and compatibility information
 */
export const getFormatDescription = (
  format: WorkoutFileFormat
): { description: string; compatibility: string[] } => {
  switch (format) {
    case "fit":
      return {
        description: "Garmin FIT format - Binary format for fitness devices",
        compatibility: ["Garmin devices", "Garmin Connect", "TrainingPeaks"],
      };
    case "tcx":
      return {
        description: "Training Center XML - Garmin's XML workout format",
        compatibility: ["Garmin Connect", "TrainingPeaks", "Strava"],
      };
    case "zwo":
      return {
        description: "Zwift Workout - XML format for Zwift platform",
        compatibility: ["Zwift"],
      };
    case "krd":
      return {
        description: "Kaiord format - JSON-based canonical workout format",
        compatibility: ["Kaiord tools", "Web editors"],
      };
    case "gcn":
      return {
        description:
          "Garmin Connect JSON - Structured workout from Garmin Connect API",
        compatibility: ["Garmin Connect", "Garmin devices"],
      };
  }
};
