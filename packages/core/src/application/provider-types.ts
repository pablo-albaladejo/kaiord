import type { SchemaValidator } from "../domain/validation/schema-validator";
import type { ToleranceChecker } from "../domain/validation/tolerance-checker";
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
import type { ConvertKrdToFit } from "./use-cases/convert-krd-to-fit";
import type { ConvertKrdToTcx } from "./use-cases/convert-krd-to-tcx";
import type { ConvertKrdToZwift } from "./use-cases/convert-krd-to-zwift";
import type { ConvertTcxToKrd } from "./use-cases/convert-tcx-to-krd";
import type { ConvertZwiftToKrd } from "./use-cases/convert-zwift-to-krd";

/**
 * Optional adapter providers that can be injected into the core.
 * Each adapter package exports a factory to create these.
 */
export type AdapterProviders = {
  fit?: { fitReader: FitReader; fitWriter: FitWriter };
  tcx?: {
    tcxReader: TcxReader;
    tcxWriter: TcxWriter;
    tcxValidator: TcxValidator;
  };
  zwo?: {
    zwiftReader: ZwiftReader;
    zwiftWriter: ZwiftWriter;
    zwiftValidator: ZwiftValidator;
  };
};

/**
 * Container for all application dependencies and use cases.
 *
 * Services are optional when adapters are not provided.
 * Use cases are only available if corresponding adapters are installed.
 */
export type Providers = {
  fitReader?: FitReader;
  fitWriter?: FitWriter;
  tcxValidator?: TcxValidator;
  tcxReader?: TcxReader;
  tcxWriter?: TcxWriter;
  zwiftValidator?: ZwiftValidator;
  zwiftReader?: ZwiftReader;
  zwiftWriter?: ZwiftWriter;
  schemaValidator: SchemaValidator;
  toleranceChecker: ToleranceChecker;
  convertFitToKrd?: ConvertFitToKrd;
  convertKrdToFit?: ConvertKrdToFit;
  convertTcxToKrd?: ConvertTcxToKrd;
  convertKrdToTcx?: ConvertKrdToTcx;
  convertZwiftToKrd?: ConvertZwiftToKrd;
  convertKrdToZwift?: ConvertKrdToZwift;
  logger: Logger;
};
