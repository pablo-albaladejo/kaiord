/**
 * Standardized CLI exit codes
 * Following common conventions and CLI spec requirements
 */
export const ExitCode = {
  /** Successful execution */
  SUCCESS: 0,
  /** Invalid arguments or usage error */
  INVALID_ARGUMENT: 1,
  /** File not found */
  FILE_NOT_FOUND: 2,
  /** Permission denied */
  PERMISSION_DENIED: 3,
  /** Parsing error (corrupted or invalid file format) */
  PARSING_ERROR: 4,
  /** Validation error (schema validation failed) */
  VALIDATION_ERROR: 5,
  /** Tolerance exceeded (round-trip validation failed) */
  TOLERANCE_EXCEEDED: 6,
  /** Authentication error (login failed or session expired) */
  AUTH_ERROR: 7,
  /** Differences found (diff command - files are different, not an error) */
  DIFFERENCES_FOUND: 10,
  /** Partial success (batch operations with some failures) */
  PARTIAL_SUCCESS: 11,
  /** Directory creation failed */
  DIRECTORY_CREATE_ERROR: 12,
  /** Unknown or unhandled error */
  UNKNOWN_ERROR: 99,
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];
