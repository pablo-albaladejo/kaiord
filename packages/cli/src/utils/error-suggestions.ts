/**
 * Error suggestions for common CLI error patterns
 * Provides actionable next steps for users when errors occur
 */

/**
 * Get a user-friendly title for common error types
 */
export const getErrorTitle = (error: Error): string => {
  const msg = error.message.toLowerCase();

  if (msg.includes("file not found")) return "File not found";
  if (msg.includes("permission denied")) return "Permission denied";
  if (msg.includes("failed to create directory")) {
    return "Directory creation failed";
  }
  if (msg.includes("cannot use both")) return "Invalid argument combination";
  if (msg.includes("no files found matching")) return "No files matched";
  if (error.name === "InvalidArgumentError") return "Invalid argument";

  return "An unexpected error occurred";
};

/**
 * Get actionable suggestions for common error patterns
 */
export const getSuggestionForError = (error: Error): Array<string> | null => {
  const msg = error.message.toLowerCase();

  if (msg.includes("file not found")) {
    return [
      "Check that the file path is correct.",
      "Use 'ls' or 'dir' to verify the file exists.",
      "Ensure the path is relative to current directory or absolute.",
    ];
  }

  if (msg.includes("permission denied")) {
    return [
      "Check file/directory permissions with 'ls -la'.",
      "Ensure you have read/write access to the path.",
      "Try running with appropriate permissions.",
    ];
  }

  if (msg.includes("failed to create directory")) {
    return [
      "Check that the parent directory exists.",
      "Verify you have write permissions to the parent directory.",
      "Ensure the path does not conflict with an existing file.",
    ];
  }

  if (msg.includes("cannot use both")) {
    return [
      "Use --output (-o) for single file conversion.",
      "Use --output-dir for batch conversion with glob patterns.",
    ];
  }

  if (msg.includes("no files found matching")) {
    return [
      "Verify the glob pattern matches your files.",
      'Use quotes around patterns with wildcards: "*.fit"',
      "Check that files exist in the specified directory.",
    ];
  }

  if (msg.includes("batch mode requires")) {
    return [
      "Add --output-dir to specify where converted files should go.",
      "Add --output-format to specify the target format.",
    ];
  }

  if (msg.includes("unable to detect format")) {
    return [
      "Use --input-format to explicitly specify the format.",
      "Supported formats: fit, krd, tcx, zwo",
    ];
  }

  return null;
};
