import type { KRD } from "../domain/schemas/krd";

export type FitWriter = (krd: KRD) => Promise<Uint8Array>;
