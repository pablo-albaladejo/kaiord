import {
  readFile as fsReadFile,
  writeFile as fsWriteFile,
  mkdir,
} from "fs/promises";
import { glob } from "glob";
import { dirname } from "path";
import type { FileFormat } from "./format-detector";

/**
 * Read a file from disk, handling binary and text formats appropriately
 * @param path - Path to the file
 * @param format - File format (determines binary vs text handling)
 * @returns File contents as Uint8Array (binary) or string (text)
 */
export const readFile = async (
  path: string,
  format: FileFormat
): Promise<Uint8Array | string> => {
  try {
    if (format === "fit") {
      // FIT files are binary
      const buffer = await fsReadFile(path);
      return new Uint8Array(buffer);
    } else {
      // KRD, TCX, ZWO are text files
      return await fsReadFile(path, "utf-8");
    }
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      if (error.code === "ENOENT") {
        throw new Error(`File not found: ${path}`);
      }
      if (error.code === "EACCES") {
        throw new Error(`Permission denied: ${path}`);
      }
    }
    throw new Error(`Failed to read file: ${path}`);
  }
};

/**
 * Write data to a file, handling binary and text formats appropriately
 * @param path - Path to write to
 * @param data - Data to write (Uint8Array for binary, string for text)
 * @param format - File format (determines binary vs text handling)
 */
export const writeFile = async (
  path: string,
  data: Uint8Array | string,
  format: FileFormat
): Promise<void> => {
  try {
    // Create directory if it doesn't exist
    const dir = dirname(path);
    await mkdir(dir, { recursive: true });

    if (format === "fit") {
      // FIT files are binary
      if (!(data instanceof Uint8Array)) {
        throw new Error("FIT files require Uint8Array data");
      }
      await fsWriteFile(path, data);
    } else {
      // KRD, TCX, ZWO are text files
      if (typeof data !== "string") {
        throw new Error("Text files require string data");
      }
      await fsWriteFile(path, data, "utf-8");
    }
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      if (error.code === "EACCES") {
        throw new Error(`Permission denied: ${path}`);
      }
    }
    if (error instanceof Error && error.message.includes("require")) {
      throw error;
    }
    throw new Error(`Failed to write file: ${path}`);
  }
};

/**
 * Find files matching a glob pattern
 * @param pattern - Glob pattern (e.g., "workouts/*.fit")
 * @returns Array of matching file paths (sorted)
 */
export const findFiles = async (pattern: string): Promise<Array<string>> => {
  const files = await glob(pattern, {
    nodir: true,
    absolute: false,
  });
  return files.sort();
};
