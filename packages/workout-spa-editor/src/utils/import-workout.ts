/**
 * Import Workout Utility
 *
 * Handles importing workout files in various formats (FIT, TCX, ZWO, KRD, GCN)
 * and converting them to the canonical KRD format.
 */

import { detectFormat } from "./file-format-detector";
import { transformError } from "./import-workout-errors";
import {
  importFitFile,
  importGcnFile,
  importKrdFile,
  importTcxFile,
  importZwoFile,
} from "./import-workout-formats";
import type { WorkoutFileFormat } from "./file-format-detector";
import type { KRD } from "@kaiord/core";

export class ImportError extends Error {
  public readonly format: WorkoutFileFormat | null;
  public readonly cause?: unknown;

  constructor(
    message: string,
    format: WorkoutFileFormat | null,
    cause?: unknown
  ) {
    super(message);
    this.name = "ImportError";
    this.format = format;
    this.cause = cause;
  }
}

export type ImportProgressCallback = (progress: number) => void;

export const importWorkout = async (
  file: File,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<KRD> => {
  signal?.throwIfAborted();

  const formatResult = detectFormat(file.name);

  if (!formatResult.success) {
    throw new ImportError(formatResult.error, null);
  }

  const format = formatResult.format;

  try {
    onProgress?.(10);
    signal?.throwIfAborted();

    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    onProgress?.(30);
    signal?.throwIfAborted();

    if (format === "krd") {
      return await importKrdFile(uint8Array, onProgress, signal);
    } else if (format === "fit") {
      return await importFitFile(uint8Array, onProgress, signal);
    } else if (format === "tcx") {
      return await importTcxFile(uint8Array, onProgress, signal);
    } else if (format === "zwo") {
      return await importZwoFile(uint8Array, onProgress, signal);
    } else if (format === "gcn") {
      return await importGcnFile(uint8Array, onProgress, signal);
    }

    throw new ImportError(`Unsupported format: ${format}`, format);
  } catch (error) {
    throw transformError(error, format);
  }
};
