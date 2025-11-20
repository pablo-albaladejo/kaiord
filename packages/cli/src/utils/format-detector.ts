import { extname } from "path";
import { z } from "zod";

/**
 * Supported file formats for workout conversion
 */
export const fileFormatSchema = z.enum(["fit", "krd", "tcx", "zwo"]);

export type FileFormat = z.infer<typeof fileFormatSchema>;

/**
 * Map of file extensions to format types
 */
const EXTENSION_TO_FORMAT: Record<string, FileFormat> = {
  ".fit": "fit",
  ".krd": "krd",
  ".tcx": "tcx",
  ".zwo": "zwo",
};

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
