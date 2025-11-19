/**
 * File Format Detector
 *
 * Utility for detecting and validating workout file formats.
 * Supports FIT, TCX, ZWO, and KRD formats.
 */

export type WorkoutFileFormat = "fit" | "tcx" | "zwo" | "krd";

export type FormatDetectionResult =
  | { success: true; format: WorkoutFileFormat }
  | { success: false; error: string };

/**
 * Detects the workout file format from the filename extension.
 *
 * @param filename - The name of the file to detect format from
 * @returns Detection result with format or error message
 */
export const detectFormat = (filename: string): FormatDetectionResult => {
  if (!filename || typeof filename !== "string") {
    return {
      success: false,
      error: "Invalid filename: filename must be a non-empty string",
    };
  }

  const trimmedFilename = filename.trim();
  if (trimmedFilename.length === 0) {
    return {
      success: false,
      error: "Invalid filename: filename cannot be empty",
    };
  }

  const ext = trimmedFilename.toLowerCase().split(".").pop();

  if (!ext) {
    return {
      success: false,
      error: `Unable to detect format: no file extension found in "${filename}"`,
    };
  }

  switch (ext) {
    case "fit":
      return { success: true, format: "fit" };
    case "tcx":
      return { success: true, format: "tcx" };
    case "zwo":
      return { success: true, format: "zwo" };
    case "krd":
    case "json":
      return { success: true, format: "krd" };
    default:
      return {
        success: false,
        error: `Unsupported file format: .${ext}. Supported formats: .fit, .tcx, .zwo, .krd, .json`,
      };
  }
};

/**
 * Validates if a file format is supported.
 *
 * @param format - The format to validate
 * @returns True if format is supported, false otherwise
 */
export const isValidFormat = (format: string): format is WorkoutFileFormat => {
  return ["fit", "tcx", "zwo", "krd"].includes(format);
};

/**
 * Gets the MIME type for a given workout file format.
 *
 * @param format - The workout file format
 * @returns The MIME type string
 */
export const getMimeType = (format: WorkoutFileFormat): string => {
  switch (format) {
    case "fit":
      return "application/octet-stream";
    case "tcx":
    case "zwo":
      return "application/xml";
    case "krd":
      return "application/json";
  }
};
