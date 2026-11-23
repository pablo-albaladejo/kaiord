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
