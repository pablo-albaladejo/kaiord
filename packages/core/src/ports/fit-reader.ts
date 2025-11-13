import type { KRD } from "../domain/schemas/krd";

export type FitReader = (buffer: Uint8Array) => Promise<KRD>;
