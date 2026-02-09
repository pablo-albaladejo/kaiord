import type { KRD } from "../domain/schemas/krd";

/**
 * Reads binary data (e.g. FIT) and converts it to KRD.
 */
export type BinaryReader = (buffer: Uint8Array) => Promise<KRD>;

/**
 * Reads text data (e.g. TCX, ZWO, GPX) and converts it to KRD.
 */
export type TextReader = (text: string) => Promise<KRD>;

/**
 * Converts KRD to binary output (e.g. FIT).
 */
export type BinaryWriter = (krd: KRD) => Promise<Uint8Array>;

/**
 * Converts KRD to text output (e.g. TCX, ZWO, GPX).
 */
export type TextWriter = (krd: KRD) => Promise<string>;
