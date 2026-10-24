/**
 * Error thrown by a writer whose output format stores absolute bpm when the
 * KRD carries a `percent_max` heart-rate target and the caller supplied no
 * maximum heart rate.
 *
 * Resolving a percentage needs the athlete's max HR; guessing one would write
 * heart-rate targets that look valid and are wrong. Callers `instanceof`-check
 * this error to ask the user for their max heart rate.
 *
 * @example
 * ```typescript
 * import { MissingMaxHeartRateError } from '@kaiord/core';
 *
 * try {
 *   await toText(krd, createGarminWriter());
 * } catch (error) {
 *   if (error instanceof MissingMaxHeartRateError) {
 *     console.log(`${error.adapterName} needs a max heart rate in bpm`);
 *   }
 * }
 * ```
 */
export class MissingMaxHeartRateError extends Error {
  public override readonly name = "MissingMaxHeartRateError";

  constructor(public readonly adapterName: string) {
    super(
      `Adapter "${adapterName}" cannot convert percent_max heart-rate targets to bpm without a max heart rate. Provide the athlete's max heart rate in bpm.`
    );
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingMaxHeartRateError);
    }
  }
}

/**
 * Factory function to create a MissingMaxHeartRateError.
 *
 * @param adapterName - The name of the writer that needs the max HR (e.g. "garmin").
 */
export const createMissingMaxHeartRateError = (
  adapterName: string
): MissingMaxHeartRateError => new MissingMaxHeartRateError(adapterName);
