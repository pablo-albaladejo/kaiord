/**
 * Generates a unique identifier for repetition blocks.
 *
 * Format: `block-{timestamp}-{random}`
 * - timestamp: Current time in milliseconds (Date.now())
 * - random: Random alphanumeric string for uniqueness
 *
 * Performance: < 1ms per generation
 *
 * @returns A unique block ID string
 *
 * @example
 * const id = generateBlockId();
 * // => "block-1704123456789-x7k2m9p4q"
 */
export const generateBlockId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `block-${timestamp}-${random}`;
};
