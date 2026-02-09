/**
 * @kaiord/zwo - ZWO format adapter for Kaiord
 */

import type { Logger, TextReader, TextWriter } from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";
import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "./adapters/fast-xml-parser";
import {
  createZwiftValidator,
  createXsdZwiftValidator,
} from "./adapters/xsd-validator";

export const createZwiftReader = (logger?: Logger): TextReader => {
  const log = logger || createConsoleLogger();
  const validator = createZwiftValidator(log);
  return createFastXmlZwiftReader(log, validator);
};

export const createZwiftWriter = (logger?: Logger): TextWriter => {
  const log = logger || createConsoleLogger();
  const validator = createZwiftValidator(log);
  return createFastXmlZwiftWriter(log, validator);
};

export const zwiftReader: TextReader = createZwiftReader();
export const zwiftWriter: TextWriter = createZwiftWriter();

export { createFastXmlZwiftReader, createFastXmlZwiftWriter };
export { createZwiftValidator, createXsdZwiftValidator };
export type {
  ZwiftValidator,
  ZwiftValidationResult,
  ZwiftValidationError,
} from "./types";
