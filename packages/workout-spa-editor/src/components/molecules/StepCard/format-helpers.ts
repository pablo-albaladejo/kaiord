/**
 * Check if a value is a valid finite number
 */
export const isValidNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};
