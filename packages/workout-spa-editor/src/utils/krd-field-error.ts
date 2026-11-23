import enErrors from "../i18n/locales/en/errors.json";

/** A KRD shape check that failed, keyed by `errors:validation.<code>`. */
export type KrdFieldCode =
  | "krd_required"
  | "krd_required_for_workout"
  | "krd_invalid_value"
  | "krd_expected_object"
  | "krd_not_object"
  | "krd_not_array";

export type FieldError = { field: string; message: string; code: KrdFieldCode };

/**
 * A field error carrying its stable code; the list localizes it by code, and
 * `message` is the English dictionary value for logs and the fallback.
 */
export const fieldError = (field: string, code: KrdFieldCode): FieldError => ({
  field,
  code,
  message: enErrors.validation[code],
});
