import { extname } from "path";

import {
  EXTENSION_TO_FORMAT,
  type FileFormat,
  fileFormatSchema,
} from "./format-registry";

export type { FileFormat } from "./format-registry";
export { fileFormatSchema } from "./format-registry";

/**
 * Detect file format from file path extension
 * @param filePath - Path to the file
 * @returns Detected format or null if unknown
 */
export const detectFormat = (filePath: string): FileFormat | null => {
  const ext = extname(filePath).toLowerCase();
  return EXTENSION_TO_FORMAT[ext] || null;
};

/**
 * Type guard to validate if a string is a valid FileFormat
 * @param format - String to validate
 * @returns True if format is valid
 */
export const validateFormat = (format: string): format is FileFormat => {
  const result = fileFormatSchema.safeParse(format);
  return result.success;
};
