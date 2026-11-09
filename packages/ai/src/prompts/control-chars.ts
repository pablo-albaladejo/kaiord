/**
 * C0 control characters (keeps tab, newline and carriage return) and DEL.
 * Input validation strips them; the prompt builder strips them first too, so
 * a delimiter cannot be hidden by a control character that is removed later.
 */
// eslint-disable-next-line no-control-regex
export const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
