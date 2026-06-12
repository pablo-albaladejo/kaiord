/**
 * Directory creation utilities
 */
import { mkdir } from "fs/promises";
import { dirname } from "path";

import { DirectoryCreateError } from "./cli-errors";
import { isNodeSystemError } from "./fs-errors";

/**
 * Create directory for output file
 * @param path - Path to the output file
 * @throws DirectoryCreateError with a specific message for failures
 */
export const createOutputDirectory = async (path: string): Promise<void> => {
  const dir = dirname(path);
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (isNodeSystemError(error)) {
      if (error.code === "EACCES") {
        throw new DirectoryCreateError(
          `Permission denied creating directory: ${dir}`,
          error
        );
      }
      if (error.code === "ENOTDIR" || error.code === "EEXIST") {
        throw new DirectoryCreateError(
          `Cannot create directory (path exists as file): ${dir}`,
          error
        );
      }
    }
    throw new DirectoryCreateError(`Failed to create directory: ${dir}`, error);
  }
};
