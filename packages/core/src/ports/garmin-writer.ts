import type { KRD } from "../domain/schemas/krd";

export type GarminWriter = (krd: KRD) => Promise<string>;
