/**
 * Path security validation utilities
 */

const DANGEROUS_CHARS = /[\0|;&`$(){}!\n\r<>]/;

/**
 * Validate that a path does not contain dangerous path components.
 * CLIs legitimately need to access files anywhere on the filesystem,
 * including using relative paths like "../other-folder".
 * This function blocks only clearly dangerous patterns.
 * @param inputPath - Path to validate
 * @throws Error if dangerous path pattern is detected
 */
export const validatePathSecurity = (inputPath: string): void => {
  if (DANGEROUS_CHARS.test(inputPath)) {
    throw new Error(
      `Invalid path: dangerous characters detected in ${inputPath}`
    );
  }
};
