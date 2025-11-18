import type { KRD } from "../domain/schemas/krd";

export type TcxReader = (xmlString: string) => Promise<KRD>;
