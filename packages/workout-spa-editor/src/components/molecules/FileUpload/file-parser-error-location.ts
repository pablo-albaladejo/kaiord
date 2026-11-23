import type { Translate } from "../../../i18n/use-translate";

type Where = { line?: number; column?: number; message?: string };

const POSITION = /position (\d+)/i;

/** The position a parser reported in its (English) message, if any. */
export const positionIn = (message: string | undefined): string | null =>
  (message && POSITION.exec(message)?.[1]) || null;

/**
 * Appends where in the file a parse failed: line and column when known,
 * then the character position when the detail does not already say it.
 */
export const withLocation = (
  message: string,
  where: Where,
  t: Translate
): string => {
  let result = message;
  if (where.line !== undefined && where.column !== undefined) {
    result += t("errors.atLineColumn", {
      line: where.line,
      column: where.column,
    });
  } else if (where.line !== undefined) {
    result += t("errors.atLine", { line: where.line });
  }
  const position = positionIn(where.message);
  if (position && !POSITION.test(result)) {
    result += t("errors.atPosition", { position });
  }
  return result;
};
