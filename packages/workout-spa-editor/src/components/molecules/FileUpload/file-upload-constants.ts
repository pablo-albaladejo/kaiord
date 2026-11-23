/**
 * File Upload Constants and Validation
 */

import { getTranslate, type Translate } from "../../../i18n/use-translate";

/** Maximum file size in bytes (10 MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum file size for display */
export const MAX_FILE_SIZE_MB = 10;

type FileSizeError = {
  title: string;
  message: string;
} | null;

/**
 * Validate file size before processing
 */
export function validateFileSize(
  file: File,
  t: Translate = getTranslate("import")
): FileSizeError {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const size = (file.size / (1024 * 1024)).toFixed(2);
    return {
      title: t("errors.tooLargeTitle"),
      message: t("errors.tooLarge", { size, limit: MAX_FILE_SIZE_MB }),
    };
  }
  return null;
}
