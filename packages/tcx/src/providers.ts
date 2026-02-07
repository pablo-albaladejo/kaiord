import type { Logger, TcxReader, TcxValidator, TcxWriter } from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";
import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "./adapters/fast-xml-parser";
import { createXsdTcxValidator } from "./adapters/xsd-validator";

export type TcxProviders = {
  tcxReader: TcxReader;
  tcxWriter: TcxWriter;
  tcxValidator: TcxValidator;
};

export const createTcxProviders = (logger?: Logger): TcxProviders => {
  const log = logger || createConsoleLogger();
  const tcxValidator = createXsdTcxValidator(log);

  return {
    tcxReader: createFastXmlTcxReader(log),
    tcxWriter: createFastXmlTcxWriter(log, tcxValidator),
    tcxValidator,
  };
};
