import type { KRD } from "../domain/schemas/krd";

export type TcxWriter = (krd: KRD) => Promise<string>;
