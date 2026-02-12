/**
 * Format-specific import functions
 *
 * Internal utilities for importing different workout file formats.
 */

import { fromBinary, fromText } from "@kaiord/core";
import { parseJSON } from "./json-parser";
import { validateKRD } from "./krd-validator";
import type { ImportProgressCallback } from "./import-workout";
import type { KRD } from "@kaiord/core";

export const importKrdFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<KRD> => {
  signal?.throwIfAborted();
  const text = new TextDecoder().decode(buffer);
  onProgress?.(40);

  signal?.throwIfAborted();
  const data = parseJSON(text);
  onProgress?.(70);

  signal?.throwIfAborted();
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
  onProgress?.(50);
  signal?.throwIfAborted();
  const { fitReader } = await import("@kaiord/fit");
  const krd = await fromBinary(buffer, fitReader);
  onProgress?.(100);
  return krd;
};

export const importTcxFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<KRD> => {
  signal?.throwIfAborted();
  const text = new TextDecoder().decode(buffer);
  onProgress?.(50);
  signal?.throwIfAborted();
  const { tcxReader } = await import("@kaiord/tcx");
  const krd = await fromText(text, tcxReader);
  onProgress?.(100);
  return krd;
};

export const importZwoFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<KRD> => {
  signal?.throwIfAborted();
  const text = new TextDecoder().decode(buffer);
  onProgress?.(50);
  signal?.throwIfAborted();
  const { zwiftReader } = await import("@kaiord/zwo");
  const krd = await fromText(text, zwiftReader);
  onProgress?.(100);
  return krd;
};

export const importGcnFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<KRD> => {
  signal?.throwIfAborted();
  const text = new TextDecoder().decode(buffer);
  onProgress?.(50);
  signal?.throwIfAborted();
  const { garminReader } = await import("@kaiord/garmin");
  const krd = await fromText(text, garminReader);
  onProgress?.(100);
  return krd;
};
