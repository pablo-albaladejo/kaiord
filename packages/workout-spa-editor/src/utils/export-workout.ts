/**
 * Export Workout Utility
 *
 * Handles exporting workout files in various formats (FIT, TCX, ZWO, KRD)
 * from the canonical KRD format.
 */

import {
  exportFitFile,
  exportGcnFile,
  exportKrdFile,
  exportTcxFile,
  exportZwoFile,
} from "./export-workout-formats";
import { getMimeType } from "./file-format-detector";
import type { WorkoutFileFormat } from "./file-format-detector";
import type { KRD } from "@kaiord/core";

export class ExportError extends Error {
  public readonly format: WorkoutFileFormat;
  public readonly cause?: unknown;

  constructor(message: string, format: WorkoutFileFormat, cause?: unknown) {
    super(message);
    this.name = "ExportError";
    this.format = format;
    this.cause = cause;
  }
}

export type ExportProgressCallback = (progress: number) => void;

export const exportWorkout = async (
  krd: KRD,
  format: WorkoutFileFormat,
  onProgress?: ExportProgressCallback
): Promise<Uint8Array> => {
  try {
    onProgress?.(10);

    let buffer: Uint8Array;

    if (format === "krd") {
      buffer = await exportKrdFile(krd, onProgress);
    } else if (format === "fit") {
      buffer = await exportFitFile(krd, onProgress);
    } else if (format === "tcx") {
      buffer = await exportTcxFile(krd, onProgress);
    } else if (format === "zwo") {
      buffer = await exportZwoFile(krd, onProgress);
    } else if (format === "gcn") {
      buffer = await exportGcnFile(krd, onProgress);
    } else {
      throw new ExportError(`Unsupported format: ${format}`, format);
    }

    return buffer;
  } catch (error) {
    if (error instanceof ExportError) {
      throw error;
    }

    throw new ExportError(
      `Failed to export workout as ${format.toUpperCase()}: ${error instanceof Error ? error.message : String(error)}`,
      format,
      error
    );
  }
};

export const downloadWorkout = (
  buffer: Uint8Array,
  filename: string,
  format: WorkoutFileFormat
): void => {
  const mimeType = getMimeType(format);
  const blob = new Blob([buffer as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
