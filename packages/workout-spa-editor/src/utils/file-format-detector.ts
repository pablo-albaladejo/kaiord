export type SupportedFormat = "fit" | "tcx" | "pwx" | "krd";

export type FormatDetectionResult = {
  format: SupportedFormat | null;
  isValid: boolean;
  error?: string;
};

/**
 * Detects the file format from the filename extension
 */
export const detectFormat = (filename: string): SupportedFormat | null => {
  if (!filename || typeof filename !== "string") {
    return null;
  }

  const ext = filename.toLowerCase().split(".").pop();

  switch (ext) {
    case "fit":
      return "fit";
    case "tcx":
      return "tcx";
    case "pwx":
      return "pwx";
    case "krd":
    case "json":
      return "krd";
    default:
      return null;
  }
};

/**
 * Validates the file format and returns detailed result
 */
export const validateFileFormat = (filename: string): FormatDetectionResult => {
  const format = detectFormat(filename);

  if (!format) {
    return {
      format: null,
      isValid: false,
      error: `Unsupported file format. Supported formats: .fit, .tcx, .pwx, .krd, .json`,
    };
  }

  return {
    format,
    isValid: true,
  };
};

/**
 * Gets the MIME type for a given format
 */
export const getMimeType = (format: SupportedFormat): string => {
  switch (format) {
    case "fit":
      return "application/octet-stream";
    case "tcx":
    case "pwx":
      return "application/xml";
    case "krd":
      return "application/json";
  }
};

/**
 * Gets the file extension for a given format
 */
export const getFileExtension = (format: SupportedFormat): string => {
  return `.${format}`;
};

/**
 * Gets a human-readable format name
 */
export const getFormatName = (format: SupportedFormat): string => {
  switch (format) {
    case "fit":
      return "FIT";
    case "tcx":
      return "TCX";
    case "pwx":
      return "PWX";
    case "krd":
      return "KRD";
  }
};

/**
 * Gets format-specific error message
 */
export const getFormatErrorMessage = (format: SupportedFormat): string => {
  const formatName = getFormatName(format);

  switch (format) {
    case "fit":
      return `Failed to parse ${formatName} file. The file may be corrupted or invalid.`;
    case "tcx":
    case "pwx":
      return `Failed to parse ${formatName} XML. The file may contain invalid XML structure.`;
    case "krd":
      return `Failed to parse ${formatName} JSON. The file may contain invalid JSON or missing required fields.`;
  }
};
