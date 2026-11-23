/**
 * File Parser Error State Builders
 *
 * Functions for creating error states from different error types.
 */

import { KrdValidationError } from "@kaiord/core";

import { getTranslate, type Translate } from "../../../i18n/use-translate";
import { ValidationError as CustomValidationError } from "../../../types/errors";
import type { ValidationError } from "../../../types/krd";
import type { ImportError } from "../../../utils/import-workout";
import { withLocation } from "./file-parser-error-location";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
};

const convertToValidationErrors = (
  errors: Array<{ field: string; message: string; code?: string }>
): Array<ValidationError> => {
  return errors.map((err) => ({
    path: err.field.split("."),
    message: err.message,
    code: err.code,
  }));
};

const wordImportError = (error: ImportError, t: Translate): string => {
  if (error.copy) return t(`errors.${error.copy.key}`, error.copy.params);
  return t("errors.unsupportedFile");
};

export const createImportErrorState = (
  error: ImportError,
  t: Translate = getTranslate("import")
): ErrorState => {
  let validationErrors: Array<ValidationError> | undefined;

  if (
    error.cause instanceof CustomValidationError ||
    error.cause instanceof KrdValidationError
  ) {
    const cause = error.cause as CustomValidationError | KrdValidationError;
    validationErrors = convertToValidationErrors(cause.errors);
  }

  let message = wordImportError(error, t);

  if (error.cause && typeof error.cause === "object" && "line" in error.cause) {
    const parsingError = error.cause as {
      line?: number;
      column?: number;
      message?: string;
    };
    message = withLocation(message, parsingError, t);
  }

  const isUnrecoverable =
    error.message.includes("not a FIT file") ||
    error.message.includes("input is not a FIT file") ||
    error.message.includes("corrupted");

  if (isUnrecoverable) {
    message += t("errors.checkFile");
  }

  return {
    title: t("errors.importFailedTitle"),
    message,
    validationErrors,
  };
};
