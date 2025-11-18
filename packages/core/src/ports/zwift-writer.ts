import type { KRD } from "../domain/schemas/krd";

/**
 * Port for writing KRD to Zwift XML format
 * Converts KRD workout data to Zwift .zwo XML string
 */
export type ZwiftWriter = (krd: KRD) => Promise<string>;
