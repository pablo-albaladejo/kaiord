/**
 * Format-specific import functions
 *
 * Internal utilities for importing different workout file formats.
 */

import type { KRD } from "@kaiord/core";
import { createDefaultProviders } from "@kaiord/core";
import type { ImportProgressCallback } from "./import-workout";
import { ImportError } from "./import-workout";

export const importKrdFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback
): Promise<KRD> => {
  try {
    const text = new TextDecoder().decode(buffer);
    onProgress?.(60);

    const krd = JSON.parse(text) as KRD;
    onProgress?.(100);

    return krd;
  } catch (error) {
    throw new ImportError(
      `Failed to parse KRD JSON: ${error instanceof Error ? error.message : String(error)}`,
      "krd",
      error
    );
  }
};

export const importFitFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback
): Promise<KRD> => {
  const providers = createDefaultProviders();

  onProgress?.(50);

  const krd = await providers.convertFitToKrd({ fitBuffer: buffer });

  onProgress?.(100);

  return krd;
};

export const importTcxFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback
): Promise<KRD> => {
  const providers = createDefaultProviders();
  const text = new TextDecoder().decode(buffer);

  onProgress?.(50);

  const krd = await providers.convertTcxToKrd({ tcxString: text });

  onProgress?.(100);

  return krd;
};

export const importZwoFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback
): Promise<KRD> => {
  const providers = createDefaultProviders();
  const text = new TextDecoder().decode(buffer);

  onProgress?.(50);

  const krd = await providers.convertZwiftToKrd({ zwiftString: text });

  onProgress?.(100);

  return krd;
};
