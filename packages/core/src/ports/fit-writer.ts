import type { KRD } from "../domain/schemas/krd";

export type FitWriter = {
  writeFromKRD: (krd: KRD) => Promise<Uint8Array>;
};
