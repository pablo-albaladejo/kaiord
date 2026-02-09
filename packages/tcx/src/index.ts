/**
 * @kaiord/tcx - TCX format adapter for Kaiord
 */

import type { Logger, TextReader, TextWriter } from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";
import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "./adapters/fast-xml-parser";
import { createXsdTcxValidator } from "./adapters/xsd-validator";

export const createTcxReader = (logger?: Logger): TextReader => {
  const log = logger || createConsoleLogger();
  return createFastXmlTcxReader(log);
};

export const createTcxWriter = (logger?: Logger): TextWriter => {
  const log = logger || createConsoleLogger();
  const validator = createXsdTcxValidator(log);
  return createFastXmlTcxWriter(log, validator);
};

export const tcxReader: TextReader = createTcxReader();
export const tcxWriter: TextWriter = createTcxWriter();

export { createFastXmlTcxReader, createFastXmlTcxWriter };
export { createXsdTcxValidator };
export type { TcxValidator, TcxValidationResult } from "./types";
