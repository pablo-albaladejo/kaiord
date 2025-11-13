import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../adapters/fit/garmin-fitsdk";
import { createConsoleLogger } from "../adapters/logger/console-logger";
import type { SchemaValidator } from "../domain/validation/schema-validator";
import { createSchemaValidator } from "../domain/validation/schema-validator";
import type { ToleranceChecker } from "../domain/validation/tolerance-checker";
import { createToleranceChecker } from "../domain/validation/tolerance-checker";
import type { FitReader } from "../ports/fit-reader";
import type { FitWriter } from "../ports/fit-writer";
import type { Logger } from "../ports/logger";
import type { ConvertFitToKrd } from "./use-cases/convert-fit-to-krd";
import { convertFitToKrd } from "./use-cases/convert-fit-to-krd";
import type { ConvertKrdToFit } from "./use-cases/convert-krd-to-fit";
import { convertKrdToFit } from "./use-cases/convert-krd-to-fit";

export type Providers = {
  fitReader: FitReader;
  fitWriter: FitWriter;
  schemaValidator: SchemaValidator;
  toleranceChecker: ToleranceChecker;
  convertFitToKrd: ConvertFitToKrd;
  convertKrdToFit: ConvertKrdToFit;
  logger: Logger;
};

export const createDefaultProviders = (logger?: Logger): Providers => {
  const log = logger || createConsoleLogger();

  const fitReader = createGarminFitSdkReader(log);
  const fitWriter = createGarminFitSdkWriter(log);
  const schemaValidator = createSchemaValidator(log);
  const toleranceChecker = createToleranceChecker();

  const convertFitToKrdUseCase = convertFitToKrd(
    fitReader,
    schemaValidator,
    log
  );
  const convertKrdToFitUseCase = convertKrdToFit(
    fitWriter,
    schemaValidator,
    log
  );

  return {
    fitReader,
    fitWriter,
    schemaValidator,
    toleranceChecker,
    convertFitToKrd: convertFitToKrdUseCase,
    convertKrdToFit: convertKrdToFitUseCase,
    logger: log,
  };
};
