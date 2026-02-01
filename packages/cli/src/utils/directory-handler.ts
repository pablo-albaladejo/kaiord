/**
 * Directory creation utilities
 */
import { mkdir } from "fs/promises";
import { dirname } from "path";
import { isNodeSystemError } from "./fs-errors";

/**
 * Create directory for output file
 * @param path - Path to the output file
 * @throws Error with specific message for directory creation failures
 */
export const createOutputDirectory = async (path: string): Promise<void> => {
  const dir = dirname(path);
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (isNodeSystemError(error)) {
      if (error.code === "EACCES") {
        throw new Error(`Permission denied creating directory: ${dir}`);
      }
      if (error.code === "ENOTDIR" || error.code === "EEXIST") {
        throw new Error(
          `Cannot create directory (path exists as file): ${dir}`
        );
      }
    }
    throw new Error(`Failed to create directory: ${dir}`);
  }
};
