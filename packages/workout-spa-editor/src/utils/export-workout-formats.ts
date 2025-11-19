/**
 * Format-specific export functions
 *
 * Internal utilities for exporting workout files to different formats.
 */

import type { KRD } from "@kaiord/core";
import { createDefaultProviders } from "@kaiord/core";
import type { ExportProgressCallback } from "./export-workout";
import { ExportError } from "./export-workout";

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
  const providers = createDefaultProviders();

  onProgress?.(50);

  const buffer = await providers.convertKrdToFit({ krd });

  onProgress?.(100);

  return buffer;
};

export const exportTcxFile = async (
  krd: KRD,
  onProgress?: ExportProgressCallback
): Promise<Uint8Array> => {
  const providers = createDefaultProviders();

  onProgress?.(50);

  const tcxString = await providers.convertKrdToTcx({ krd });
  const buffer = new TextEncoder().encode(tcxString);

  onProgress?.(100);

  return buffer;
};

export const exportZwoFile = async (
  krd: KRD,
  onProgress?: ExportProgressCallback
): Promise<Uint8Array> => {
  const providers = createDefaultProviders();

  onProgress?.(50);

  const zwoString = await providers.convertKrdToZwift({ krd });
  const buffer = new TextEncoder().encode(zwoString);

  onProgress?.(100);

  return buffer;
};
