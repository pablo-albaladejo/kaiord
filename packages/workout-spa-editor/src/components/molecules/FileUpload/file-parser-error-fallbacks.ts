/**
 * File Parser Error Fallback Handlers
 *
 * Fallback error handlers for generic and unrecoverable errors.
 */

import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { ValidationError } from "../../../types/krd";
import { positionIn, withLocation } from "./file-parser-error-location";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
};

const importT = (t?: Translate): Translate => t ?? getTranslate("import");

export const createFileParsingErrorState = (
  error: { message: string; line?: number; column?: number },
  t?: Translate
): ErrorState => {
  const tr = importT(t);
  const position = positionIn(error.message);
  if (error.line === undefined && !position) {
    const message = tr("errors.parseJson", { detail: error.message });
    return { title: tr("errors.invalidFormatTitle"), message };
  }
  const at = position ? tr("errors.atPosition", { position }) : "";
  const where = { line: error.line, column: error.column };
  const message = withLocation(tr("errors.parseJsonPlain") + at, where, tr);
  return { title: tr("errors.invalidFormatTitle"), message };
};

export const createSyntaxErrorState = (
  error: SyntaxError,
  t?: Translate
): ErrorState => {
  const tr = importT(t);
  let message = tr("errors.parseJson", { detail: error.message });
  if (positionIn(error.message)) message += tr("errors.checkFile");
  return { title: tr("errors.invalidFormatTitle"), message };
};

export const createUnrecoverableErrorState = (
  error: Error,
  t?: Translate
): ErrorState => {
  const tr = importT(t);
  return {
    title: tr("errors.importFailedTitle"),
    message: `${error.message}${tr("errors.checkFile")}`,
  };
};

export const createGenericErrorState = (
  error: unknown,
  t?: Translate
): ErrorState => {
  const tr = importT(t);
  const detail =
    error instanceof Error ? error.message : tr("errors.unknownError");
  return {
    title: tr("errors.fileReadTitle"),
    message: `${tr("errors.readFailed", { detail })}${tr("errors.checkFile")}`,
  };
};
