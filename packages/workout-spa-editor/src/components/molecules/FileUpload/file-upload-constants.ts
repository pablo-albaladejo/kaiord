/**
 * File Upload Constants and Validation
 */

/** Maximum file size in bytes (10 MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum file size for display */
export const MAX_FILE_SIZE_MB = 10;

/**
 * Supported file extensions and their MIME types
 */
export const SUPPORTED_FILE_TYPES = {
  fit: "application/octet-stream",
  tcx: "application/xml",
  zwo: "application/xml",
  krd: "application/json",
  json: "application/json",
} as const;

export type SupportedExtension = keyof typeof SUPPORTED_FILE_TYPES;

type FileSizeError = {
  title: string;
  message: string;
} | null;

/**
 * Validate file size before processing
 */
export function validateFileSize(file: File): FileSizeError {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      title: "File too large",
      message: `The file is ${fileSizeMB} MB, which exceeds the ${MAX_FILE_SIZE_MB} MB limit. Please use a smaller file.`,
    };
  }
  return null;
}
