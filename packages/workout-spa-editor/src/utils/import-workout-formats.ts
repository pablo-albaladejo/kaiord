/**
 * Format-specific import functions
 *
 * Internal utilities for importing different workout file formats.
 */

import type { KRD } from "@kaiord/core";
import { createDefaultProviders } from "@kaiord/core";
import type { ImportProgressCallback } from "./import-workout";
import { parseJSON } from "./json-parser";
import { validateKRD } from "./krd-validator";

export const importKrdFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback
): Promise<KRD> => {
  const text = new TextDecoder().decode(buffer);
  onProgress?.(40);

  // Parse JSON with enhanced error messages
  const data = parseJSON(text);
  onProgress?.(70);

  // Validate KRD structure
  const krd = validateKRD(data);
  onProgress?.(100);

  return krd;
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
