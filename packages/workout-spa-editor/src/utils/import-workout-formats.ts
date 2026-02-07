/**
 * Format-specific import functions
 *
 * Internal utilities for importing different workout file formats.
 */

import type { KRD } from "@kaiord/core";
import { createAllProviders } from "@kaiord/all";
import type { ImportProgressCallback } from "./import-workout";
import { parseJSON } from "./json-parser";
import { validateKRD } from "./krd-validator";

export const importKrdFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<KRD> => {
  signal?.throwIfAborted();
  const text = new TextDecoder().decode(buffer);
  onProgress?.(40);

  signal?.throwIfAborted();
  // Parse JSON with enhanced error messages
  const data = parseJSON(text);
  onProgress?.(70);

  signal?.throwIfAborted();
  // Validate KRD structure
  const krd = validateKRD(data);
  onProgress?.(100);

  return krd;
};

export const importFitFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<KRD> => {
  signal?.throwIfAborted();
  const providers = createAllProviders();

  onProgress?.(50);
  signal?.throwIfAborted();

  const krd = await providers.convertFitToKrd!({ fitBuffer: buffer });

  onProgress?.(100);

  return krd;
};

export const importTcxFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<KRD> => {
  signal?.throwIfAborted();
  const providers = createAllProviders();
  const text = new TextDecoder().decode(buffer);

  onProgress?.(50);
  signal?.throwIfAborted();

  const krd = await providers.convertTcxToKrd!({ tcxString: text });

  onProgress?.(100);

  return krd;
};

export const importZwoFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<KRD> => {
  signal?.throwIfAborted();
  const providers = createAllProviders();
  const text = new TextDecoder().decode(buffer);

  onProgress?.(50);
  signal?.throwIfAborted();

  const krd = await providers.convertZwiftToKrd!({ zwiftString: text });

  onProgress?.(100);

  return krd;
};
