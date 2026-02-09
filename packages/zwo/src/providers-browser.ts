import type {
  Logger,
  ZwiftReader,
  ZwiftValidator,
  ZwiftWriter,
} from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";
import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "./adapters/fast-xml-parser";
import { createZwiftValidator } from "./adapters/xsd-validator-browser";

export type ZwoProviders = {
  zwiftReader: ZwiftReader;
  zwiftWriter: ZwiftWriter;
  zwiftValidator: ZwiftValidator;
};

export const createZwoProviders = (logger?: Logger): ZwoProviders => {
  const log = logger || createConsoleLogger();
  const zwiftValidator = createZwiftValidator(log);

  return {
    zwiftReader: createFastXmlZwiftReader(log, zwiftValidator),
    zwiftWriter: createFastXmlZwiftWriter(log, zwiftValidator),
    zwiftValidator,
  };
};
