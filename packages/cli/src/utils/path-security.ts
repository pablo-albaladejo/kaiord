/**
 * Path security validation utilities
 */

/**
 * Validate that a path does not contain dangerous path components.
 * CLIs legitimately need to access files anywhere on the filesystem,
 * including using relative paths like "../other-folder".
 * This function blocks only clearly dangerous patterns.
 * @param inputPath - Path to validate
 * @throws Error if dangerous path pattern is detected
 */
export const validatePathSecurity = (inputPath: string): void => {
  // Block null bytes which could be used for injection attacks
  if (inputPath.includes("\0")) {
    throw new Error(`Invalid path: null byte detected in ${inputPath}`);
  }

  // Block paths that attempt command injection
  if (inputPath.includes("|") || inputPath.includes(";")) {
    throw new Error(
      `Invalid path: shell metacharacters detected in ${inputPath}`
    );
  }
};
