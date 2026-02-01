/**
 * Error suggestions for common CLI error patterns
 * Provides actionable next steps for users when errors occur
 */

type ErrorPattern = {
  pattern: string;
  title: string;
  suggestions: Array<string>;
};

const ERROR_PATTERNS: Array<ErrorPattern> = [
  {
    pattern: "file not found",
    title: "File not found",
    suggestions: [
      "Check that the file path is correct.",
      "Use 'ls' or 'dir' to verify the file exists.",
      "Ensure the path is relative to current directory or absolute.",
    ],
  },
  {
    pattern: "permission denied",
    title: "Permission denied",
    suggestions: [
      "Check file/directory permissions with 'ls -la'.",
      "Ensure you have read/write access to the path.",
      "Try running with appropriate permissions.",
    ],
  },
  {
    pattern: "failed to create directory",
    title: "Directory creation failed",
    suggestions: [
      "Check that the parent directory exists.",
      "Verify you have write permissions to the parent directory.",
      "Ensure the path does not conflict with an existing file.",
    ],
  },
  {
    pattern: "cannot create directory",
    title: "Directory creation failed",
    suggestions: [
      "Check that the parent directory exists.",
      "Verify you have write permissions to the parent directory.",
      "Ensure the path does not conflict with an existing file.",
    ],
  },
  {
    pattern: "cannot use both",
    title: "Invalid argument combination",
    suggestions: [
      "Use --output (-o) for single file conversion.",
      "Use --output-dir for batch conversion with glob patterns.",
    ],
  },
  {
    pattern: "no files found matching",
    title: "No files matched",
    suggestions: [
      "Verify the glob pattern matches your files.",
      'Use quotes around patterns with wildcards: "*.fit"',
      "Check that files exist in the specified directory.",
    ],
  },
  {
    pattern: "batch mode requires",
    title: "Invalid argument",
    suggestions: [
      "Add --output-dir to specify where converted files should go.",
      "Add --output-format to specify the target format.",
    ],
  },
  {
    pattern: "unable to detect format",
    title: "Invalid argument",
    suggestions: [
      "Use --input-format to explicitly specify the format.",
      "Supported formats: fit, krd, tcx, zwo",
    ],
  },
];

const findMatchingPattern = (msg: string): ErrorPattern | undefined => {
  return ERROR_PATTERNS.find((p) => msg.includes(p.pattern));
};

/**
 * Get a user-friendly title for common error types
 */
export const getErrorTitle = (error: Error): string => {
  const msg = error.message.toLowerCase();
  const match = findMatchingPattern(msg);
  if (match) return match.title;
  if (error.name === "InvalidArgumentError") return "Invalid argument";
  return "An unexpected error occurred";
};

/**
 * Get actionable suggestions for common error patterns
 */
export const getSuggestionForError = (error: Error): Array<string> | null => {
  const msg = error.message.toLowerCase();
  const match = findMatchingPattern(msg);
  return match?.suggestions ?? null;
};
