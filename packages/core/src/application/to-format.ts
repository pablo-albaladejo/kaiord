import { validateKrd } from "../domain/validation/validate-krd";
import type { KRD } from "../domain/schemas/krd";
import type { BinaryWriter, TextWriter } from "../ports/format-strategy";
import type { Logger } from "../ports/logger";

/**
 * Converts KRD to binary format with validation.
 *
 * @example
 * ```typescript
 * import { toBinary } from '@kaiord/core';
 * import { fitWriter } from '@kaiord/fit';
 *
 * const buffer = await toBinary(krd, fitWriter);
 * ```
 */
export const toBinary = async (
  krd: KRD,
  writer: BinaryWriter,
  logger?: Logger
): Promise<Uint8Array> => {
  logger?.info("Converting KRD to binary format");
  validateKrd(krd);
  const result = await writer(krd);
  logger?.info("Conversion from KRD successful");
  return result;
};

/**
 * Converts KRD to text format with validation.
 *
 * @example
 * ```typescript
 * import { toText } from '@kaiord/core';
 * import { tcxWriter } from '@kaiord/tcx';
 *
 * const xml = await toText(krd, tcxWriter);
 * ```
 */
export const toText = async (
  krd: KRD,
  writer: TextWriter,
  logger?: Logger
): Promise<string> => {
  logger?.info("Converting KRD to text format");
  validateKrd(krd);
  const result = await writer(krd);
  logger?.info("Conversion from KRD successful");
  return result;
};
