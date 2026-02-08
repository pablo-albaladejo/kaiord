/**
 * Domain Errors for Kaiord
 * Following Clean Architecture error handling patterns
 *
 * This file re-exports all error types for convenience
 */

export type { ToleranceViolation, ValidationError } from "./error-types";

export { createFitParsingError, FitParsingError } from "./fit-errors";

export { createKrdValidationError, KrdValidationError } from "./krd-errors";

export {
  createTcxParsingError,
  createTcxValidationError,
  TcxParsingError,
  TcxValidationError,
} from "./tcx-errors";

export {
  createZwiftParsingError,
  createZwiftValidationError,
  ZwiftParsingError,
  ZwiftValidationError,
} from "./zwift-errors";

export { createGarminParsingError, GarminParsingError } from "./garmin-errors";

export {
  createToleranceExceededError,
  ToleranceExceededError,
} from "./tolerance-errors";
