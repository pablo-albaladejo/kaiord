import type { KRD } from "@kaiord/core";
import { detectFormat } from "./file-format-detector";
import {
  importFitFile,
  importKrdFile,
  importPwxFile,
  importTcxFile,
} from "./import-workout-helpers";

/**
 * Import a workout file and convert it to KRD format
 *
 * @param file - The file to import
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Promise resolving to KRD object
 * @throws Error if format is unsupported or conversion fails
 */
export const importWorkout = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<KRD> => {
  const format = detectFormat(file.name);

  if (!format) {
    throw new Error(
      `Unsupported file format. Supported formats: .fit, .tcx, .pwx, .krd, .json`
    );
  }

  onProgress?.(10);

  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  onProgress?.(30);

  switch (format) {
    case "krd":
      return importKrdFile(uint8Array, onProgress);
    case "fit":
      return importFitFile(uint8Array, onProgress);
    case "tcx":
      return importTcxFile(uint8Array, onProgress);
    case "pwx":
      return importPwxFile(uint8Array, onProgress);
  }
};
