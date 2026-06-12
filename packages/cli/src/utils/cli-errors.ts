/**
 * Typed CLI errors that replace raw `Error` throws carrying magic-string
 * messages. The single exit-code mapper keys on these classes (and their
 * `name`), never on message text, so wording can change freely.
 */

/**
 * The requested format (input, output, or operation) is not supported.
 * Maps to INVALID_ARGUMENT.
 */
export class UnsupportedFormatError extends Error {
  public override readonly name = "UnsupportedFormatError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnsupportedFormatError);
    }
  }
}

/**
 * The CLI could not create the requested output directory.
 * Maps to DIRECTORY_CREATE_ERROR.
 */
export class DirectoryCreateError extends Error {
  public override readonly name = "DirectoryCreateError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DirectoryCreateError);
    }
  }
}

/**
 * An installation/environment problem: a bundled schema or runtime dependency
 * could not be resolved. Maps to ENVIRONMENT_ERROR; the message should advise
 * reinstalling the CLI.
 */
export class EnvironmentError extends Error {
  public override readonly name = "EnvironmentError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnvironmentError);
    }
  }
}
