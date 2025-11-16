import type { ValidationError } from "../krd";

export type ValidationResult<T> =
  | { success: true; data: T; errors: [] }
  | { success: false; data?: undefined; errors: Array<ValidationError> };
