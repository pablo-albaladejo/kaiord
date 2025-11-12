import type { KRD } from "../domain/schemas/krd";

export type FitReader = {
  readToKRD: (buffer: Uint8Array) => Promise<KRD>;
};
