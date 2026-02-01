/**
 * File I/O operations for the CLI
 */
import { readFile as fsReadFile, writeFile as fsWriteFile } from "fs/promises";
import { glob } from "glob";
import { createOutputDirectory } from "./directory-handler";
import type { FileFormat } from "./format-detector";
import { isNodeSystemError } from "./fs-errors";
import { validatePathSecurity } from "./path-security";

// Re-export for backwards compatibility
export { isNodeSystemError } from "./fs-errors";
export { validatePathSecurity } from "./path-security";

/**
 * Read a file from disk, handling binary and text formats appropriately
 */
export const readFile = async (
  path: string,
  format: FileFormat
): Promise<Uint8Array | string> => {
  validatePathSecurity(path);

  try {
    if (format === "fit") {
      const buffer = await fsReadFile(path);
      return new Uint8Array(buffer);
    } else {
      return await fsReadFile(path, "utf-8");
    }
  } catch (error) {
    if (isNodeSystemError(error)) {
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
 */
export const writeFile = async (
  path: string,
  data: Uint8Array | string,
  format: FileFormat
): Promise<void> => {
  validatePathSecurity(path);

  if (format === "fit" && !(data instanceof Uint8Array)) {
    throw new Error("FIT files require Uint8Array data");
  }
  if (format !== "fit" && typeof data !== "string") {
    throw new Error("Text files require string data");
  }

  await createOutputDirectory(path);

  try {
    if (format === "fit") {
      await fsWriteFile(path, data as Uint8Array);
    } else {
      await fsWriteFile(path, data as string, "utf-8");
    }
  } catch (error) {
    if (isNodeSystemError(error)) {
      if (error.code === "EACCES") {
        throw new Error(`Permission denied writing file: ${path}`);
      }
      if (error.code === "EISDIR") {
        throw new Error(`Cannot write file (path is a directory): ${path}`);
      }
    }
    throw new Error(`Failed to write file: ${path}`);
  }
};

/**
 * Find files matching a glob pattern
 */
export const findFiles = async (pattern: string): Promise<Array<string>> => {
  const files = await glob(pattern, {
    nodir: true,
    absolute: false,
  });
  return files.sort();
};
