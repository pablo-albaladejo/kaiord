/**
 * Format-specific export functions
 *
 * Internal utilities for exporting workout files to different formats.
 */

import { toBinary, toText } from "@kaiord/core";
import { fitWriter } from "@kaiord/fit";
import { garminWriter } from "@kaiord/garmin";
import { tcxWriter } from "@kaiord/tcx";
import { zwiftWriter } from "@kaiord/zwo";
import { ExportError } from "./export-workout";
import type { ExportProgressCallback } from "./export-workout";
import type { KRD } from "@kaiord/core";

export const exportKrdFile = async (
  krd: KRD,
  onProgress?: ExportProgressCallback
): Promise<Uint8Array> => {
  try {
    onProgress?.(50);
    const json = JSON.stringify(krd, null, 2);
    const buffer = new TextEncoder().encode(json);
    onProgress?.(100);
    return buffer;
  } catch (error) {
    throw new ExportError(
      `Failed to serialize KRD to JSON: ${error instanceof Error ? error.message : String(error)}`,
      "krd",
      error
    );
  }
};

export const exportFitFile = async (
  krd: KRD,
  onProgress?: ExportProgressCallback
): Promise<Uint8Array> => {
  onProgress?.(50);
  const buffer = await toBinary(krd, fitWriter);
  onProgress?.(100);
  return buffer;
};

export const exportTcxFile = async (
  krd: KRD,
  onProgress?: ExportProgressCallback
): Promise<Uint8Array> => {
  onProgress?.(50);
  const tcxString = await toText(krd, tcxWriter);
  const buffer = new TextEncoder().encode(tcxString);
  onProgress?.(100);
  return buffer;
};

export const exportZwoFile = async (
  krd: KRD,
  onProgress?: ExportProgressCallback
): Promise<Uint8Array> => {
  onProgress?.(50);
  const zwoString = await toText(krd, zwiftWriter);
  const buffer = new TextEncoder().encode(zwoString);
  onProgress?.(100);
  return buffer;
};

export const exportGcnFile = async (
  krd: KRD,
  onProgress?: ExportProgressCallback
): Promise<Uint8Array> => {
  onProgress?.(50);
  const gcnString = await toText(krd, garminWriter);
  const buffer = new TextEncoder().encode(gcnString);
  onProgress?.(100);
  return buffer;
};
