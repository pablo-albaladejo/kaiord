import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "../adapters/fit/garmin-fitsdk";
import { createConsoleLogger } from "../adapters/logger/console-logger";
import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "../adapters/tcx/fast-xml-parser";
import { createXsdTcxValidator } from "../adapters/tcx/xsd-validator";
import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "../adapters/zwift/fast-xml-parser";
import { createXsdZwiftValidator } from "../adapters/zwift/xsd-validator";
import type { SchemaValidator } from "../domain/validation/schema-validator";
import { createSchemaValidator } from "../domain/validation/schema-validator";
import type { ToleranceChecker } from "../domain/validation/tolerance-checker";
import { createToleranceChecker } from "../domain/validation/tolerance-checker";
import type { FitReader } from "../ports/fit-reader";
import type { FitWriter } from "../ports/fit-writer";
import type { Logger } from "../ports/logger";
import type { TcxReader } from "../ports/tcx-reader";
import type { TcxValidator } from "../ports/tcx-validator";
import type { TcxWriter } from "../ports/tcx-writer";
import type { ZwiftReader } from "../ports/zwift-reader";
import type { ZwiftValidator } from "../ports/zwift-validator";
import type { ZwiftWriter } from "../ports/zwift-writer";
import type { ConvertFitToKrd } from "./use-cases/convert-fit-to-krd";
import { convertFitToKrd } from "./use-cases/convert-fit-to-krd";
import type { ConvertKrdToFit } from "./use-cases/convert-krd-to-fit";
import { convertKrdToFit } from "./use-cases/convert-krd-to-fit";
import type { ConvertKrdToTcx } from "./use-cases/convert-krd-to-tcx";
import { convertKrdToTcx } from "./use-cases/convert-krd-to-tcx";
import type { ConvertKrdToZwift } from "./use-cases/convert-krd-to-zwift";
import { convertKrdToZwift } from "./use-cases/convert-krd-to-zwift";
import type { ConvertTcxToKrd } from "./use-cases/convert-tcx-to-krd";
import { convertTcxToKrd } from "./use-cases/convert-tcx-to-krd";
import type { ConvertZwiftToKrd } from "./use-cases/convert-zwift-to-krd";
import { convertZwiftToKrd } from "./use-cases/convert-zwift-to-krd";

export type Providers = {
  fitReader: FitReader;
  fitWriter: FitWriter;
  tcxValidator: TcxValidator;
  tcxReader: TcxReader;
  tcxWriter: TcxWriter;
  zwiftValidator: ZwiftValidator;
  zwiftReader: ZwiftReader;
  zwiftWriter: ZwiftWriter;
  schemaValidator: SchemaValidator;
  toleranceChecker: ToleranceChecker;
  convertFitToKrd: ConvertFitToKrd;
  convertKrdToFit: ConvertKrdToFit;
  convertTcxToKrd: ConvertTcxToKrd;
  convertKrdToTcx: ConvertKrdToTcx;
  convertZwiftToKrd: ConvertZwiftToKrd;
  convertKrdToZwift: ConvertKrdToZwift;
  logger: Logger;
};

export const createDefaultProviders = (logger?: Logger): Providers => {
  const log = logger || createConsoleLogger();
  const tcxValidator = createXsdTcxValidator(log);
  const zwiftValidator = createXsdZwiftValidator(log);

  const fitReader = createGarminFitSdkReader(log);
  const fitWriter = createGarminFitSdkWriter(log);
  const tcxReader = createFastXmlTcxReader(log);
  const tcxWriter = createFastXmlTcxWriter(log, tcxValidator);
  const zwiftReader = createFastXmlZwiftReader(log, zwiftValidator);
  const zwiftWriter = createFastXmlZwiftWriter(log, zwiftValidator);
  const schemaValidator = createSchemaValidator(log);
  const toleranceChecker = createToleranceChecker();

  return {
    fitReader,
    fitWriter,
    tcxValidator,
    tcxReader,
    tcxWriter,
    zwiftValidator,
    zwiftReader,
    zwiftWriter,
    schemaValidator,
    toleranceChecker,
    convertFitToKrd: convertFitToKrd(fitReader, schemaValidator, log),
    convertKrdToFit: convertKrdToFit(fitWriter, schemaValidator, log),
    convertTcxToKrd: convertTcxToKrd(tcxReader, schemaValidator, log),
    convertKrdToTcx: convertKrdToTcx(tcxWriter, schemaValidator, log),
    convertZwiftToKrd: convertZwiftToKrd(zwiftReader, schemaValidator, log),
    convertKrdToZwift: convertKrdToZwift(zwiftWriter, schemaValidator, log),
    logger: log,
  };
};
