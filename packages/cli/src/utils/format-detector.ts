import { extname } from "path";

import { EXTENSION_TO_FORMAT, type FileFormat } from "./format-registry";

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
