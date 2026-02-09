import { validateKrd } from "../domain/validation/validate-krd";
import type { KRD } from "../domain/schemas/krd";
import type { BinaryReader, TextReader } from "../ports/format-strategy";
import type { Logger } from "../ports/logger";

/**
 * Converts binary format data to KRD with validation.
 *
 * @example
 * ```typescript
 * import { fromBinary } from '@kaiord/core';
 * import { fitReader } from '@kaiord/fit';
 *
 * const krd = await fromBinary(buffer, fitReader);
 * ```
 */
export const fromBinary = async (
  buffer: Uint8Array,
  reader: BinaryReader,
  logger?: Logger
): Promise<KRD> => {
  logger?.info("Converting binary format to KRD");
  const krd = await reader(buffer);
  const validated = validateKrd(krd);
  logger?.info("Conversion to KRD successful");
  return validated;
};

/**
 * Converts text format data to KRD with validation.
 *
 * @example
 * ```typescript
 * import { fromText } from '@kaiord/core';
 * import { tcxReader } from '@kaiord/tcx';
 *
 * const krd = await fromText(xmlString, tcxReader);
 * ```
 */
export const fromText = async (
  text: string,
  reader: TextReader,
  logger?: Logger
): Promise<KRD> => {
  logger?.info("Converting text format to KRD");
  const krd = await reader(text);
  const validated = validateKrd(krd);
  logger?.info("Conversion to KRD successful");
  return validated;
};
