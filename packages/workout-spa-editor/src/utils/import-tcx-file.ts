import type { KRD } from "@kaiord/core";
import { fromText } from "@kaiord/core";

import { createWarningLogger } from "./create-warning-logger";
import type {
  ImportProgressCallback,
  ImportWarningCallback,
} from "./import-workout";

export const importTcxFile = async (
  buffer: Uint8Array,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal,
  onWarning?: ImportWarningCallback
): Promise<KRD> => {
  signal?.throwIfAborted();
  const text = new TextDecoder().decode(buffer);
  onProgress?.(50);
  signal?.throwIfAborted();
  const { createTcxReader } = await import("@kaiord/tcx");
  const reader = createTcxReader(createWarningLogger(onWarning));
  const krd = await fromText(text, reader);
  onProgress?.(100);
  return krd;
};
