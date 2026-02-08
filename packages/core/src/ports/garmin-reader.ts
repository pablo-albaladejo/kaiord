import type { KRD } from "../domain/schemas/krd";

export type GarminReader = (gcnString: string) => Promise<KRD>;
