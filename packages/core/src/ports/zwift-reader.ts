import type { KRD } from "../domain/schemas/krd";

export type ZwiftReader = (xmlString: string) => Promise<KRD>;
