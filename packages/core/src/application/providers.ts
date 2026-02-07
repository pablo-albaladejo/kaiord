import { convertFitToKrd } from "./use-cases/convert-fit-to-krd";
import { convertKrdToFit } from "./use-cases/convert-krd-to-fit";
import { convertKrdToTcx } from "./use-cases/convert-krd-to-tcx";
import { convertKrdToZwift } from "./use-cases/convert-krd-to-zwift";
import { convertTcxToKrd } from "./use-cases/convert-tcx-to-krd";
import { convertZwiftToKrd } from "./use-cases/convert-zwift-to-krd";
import { createConsoleLogger } from "../adapters/logger/console-logger";
import { createSchemaValidator } from "../domain/validation/schema-validator";
import { createToleranceChecker } from "../domain/validation/tolerance-checker";
import type { AdapterProviders, Providers } from "./provider-types";
import type { Logger } from "../ports/logger";

export type { AdapterProviders, Providers } from "./provider-types";

const wireAdapters = (
  result: Providers,
  adapters: AdapterProviders | undefined,
  sv: ReturnType<typeof createSchemaValidator>,
  log: Logger
): void => {
  if (adapters?.fit) {
    result.fitReader = adapters.fit.fitReader;
    result.fitWriter = adapters.fit.fitWriter;
    result.convertFitToKrd = convertFitToKrd(adapters.fit.fitReader, sv, log);
    result.convertKrdToFit = convertKrdToFit(adapters.fit.fitWriter, sv, log);
  }
  if (adapters?.tcx) {
    result.tcxReader = adapters.tcx.tcxReader;
    result.tcxWriter = adapters.tcx.tcxWriter;
    result.tcxValidator = adapters.tcx.tcxValidator;
    result.convertTcxToKrd = convertTcxToKrd(adapters.tcx.tcxReader, sv, log);
    result.convertKrdToTcx = convertKrdToTcx(adapters.tcx.tcxWriter, sv, log);
  }
  if (adapters?.zwo) {
    result.zwiftReader = adapters.zwo.zwiftReader;
    result.zwiftWriter = adapters.zwo.zwiftWriter;
    result.zwiftValidator = adapters.zwo.zwiftValidator;
    result.convertZwiftToKrd = convertZwiftToKrd(
      adapters.zwo.zwiftReader,
      sv,
      log
    );
    result.convertKrdToZwift = convertKrdToZwift(
      adapters.zwo.zwiftWriter,
      sv,
      log
    );
  }
};

/**
 * Creates default providers with adapter dependencies wired together.
 *
 * @param adapters - Optional adapter providers (FIT, TCX, ZWO)
 * @param logger - Optional custom logger
 * @returns Providers object with available dependencies and use cases
 */
export const createDefaultProviders = (
  adapters?: AdapterProviders,
  logger?: Logger
): Providers => {
  const log = logger || createConsoleLogger();
  const sv = createSchemaValidator(log);
  const result: Providers = {
    schemaValidator: sv,
    toleranceChecker: createToleranceChecker(),
    logger: log,
  };
  wireAdapters(result, adapters, sv, log);
  return result;
};
