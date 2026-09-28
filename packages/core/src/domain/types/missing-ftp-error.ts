/**
 * Error thrown by a writer whose output format stores absolute watts when the
 * KRD carries a `percent_ftp` power target and the caller supplied no FTP.
 *
 * Resolving a percentage needs the athlete's FTP; guessing one would write
 * power targets that look valid and are wrong. Callers `instanceof`-check this
 * error to ask the user for their FTP.
 *
 * @example
 * ```typescript
 * import { MissingFtpError } from '@kaiord/core';
 *
 * try {
 *   await toText(krd, createGarminWriter());
 * } catch (error) {
 *   if (error instanceof MissingFtpError) {
 *     console.log(`${error.adapterName} needs an FTP in watts`);
 *   }
 * }
 * ```
 */
export class MissingFtpError extends Error {
  public override readonly name = "MissingFtpError";

  constructor(public readonly adapterName: string) {
    super(
      `Adapter "${adapterName}" cannot convert percent_ftp power targets to watts without an FTP. Provide the athlete's FTP in watts.`
    );
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingFtpError);
    }
  }
}

/**
 * Factory function to create a MissingFtpError.
 *
 * @param adapterName - The name of the writer that needs the FTP (e.g. "garmin").
 */
export const createMissingFtpError = (adapterName: string): MissingFtpError =>
  new MissingFtpError(adapterName);
