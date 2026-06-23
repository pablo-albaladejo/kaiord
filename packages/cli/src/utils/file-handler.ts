/**
 * File I/O operations for the CLI
 */
import { readFile as fsReadFile, writeFile as fsWriteFile } from "fs/promises";
import { glob } from "glob";

import { createOutputDirectory } from "./directory-handler";
import type { FileFormat } from "./format-detector";
import { isBinaryFormat } from "./format-registry";
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
    if (isBinaryFormat(format)) {
      const buffer = await fsReadFile(path);
      return new Uint8Array(buffer);
    } else {
      return await fsReadFile(path, "utf-8");
    }
  } catch (error) {
    if (isNodeSystemError(error)) {
      if (error.code === "ENOENT") {
        // Preserve the Node code so the exit-code mapper classifies by signature,
        // not by message text.
        throw Object.assign(new Error(`File not found: ${path}`), {
          code: "ENOENT",
          cause: error,
        });
      }
      if (error.code === "EACCES") {
        throw Object.assign(new Error(`Permission denied: ${path}`), {
          code: "EACCES",
          cause: error,
        });
      }
    }
    throw new Error(`Failed to read file: ${path}`, { cause: error });
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

  const binary = isBinaryFormat(format);
  if (binary && !(data instanceof Uint8Array)) {
    throw new Error("FIT files require Uint8Array data");
  }
  if (!binary && typeof data !== "string") {
    throw new Error("Text files require string data");
  }

  await createOutputDirectory(path);

  try {
    if (binary) {
      await fsWriteFile(path, data as Uint8Array);
    } else {
      await fsWriteFile(path, data as string, "utf-8");
    }
  } catch (error) {
    if (isNodeSystemError(error)) {
      if (error.code === "EACCES") {
        throw new Error(`Permission denied writing file: ${path}`, {
          cause: error,
        });
      }
      if (error.code === "EISDIR") {
        throw new Error(`Cannot write file (path is a directory): ${path}`, {
          cause: error,
        });
      }
    }
    throw new Error(`Failed to write file: ${path}`, { cause: error });
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
