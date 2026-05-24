import type { FileType } from "../schemas/file-type";

/**
 * Error thrown by a workout-only format adapter (TCX, ZWO, GCN) when
 * asked to write a KRD whose `type` is one of the health variants
 * introduced in KRD v2.0 (`sleep_record`, `weight_measurement`,
 * `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`).
 *
 * This typed error replaces the generic `throw new Error(...)` previously
 * used for unsupported types and lets callers (e.g., the SPA import flow)
 * `instanceof`-check it to route the offending KRD to the FIT pipeline
 * instead.
 *
 * @example
 * ```typescript
 * import { UnsupportedKrdTypeError } from '@kaiord/core';
 *
 * try {
 *   await tcxWriter(sleepKrd);
 * } catch (error) {
 *   if (error instanceof UnsupportedKrdTypeError) {
 *     console.log(`${error.adapterName} cannot write ${error.krdType}`);
 *   }
 * }
 * ```
 */
export class UnsupportedKrdTypeError extends Error {
  public override readonly name = "UnsupportedKrdTypeError";

  constructor(
    public readonly krdType: FileType,
    public readonly adapterName: string
  ) {
    super(
      `Adapter "${adapterName}" cannot write KRD type "${krdType}". This format is workout-only; route health-typed KRDs to the FIT pipeline.`
    );
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnsupportedKrdTypeError);
    }
  }
}

/**
 * Factory function to create an UnsupportedKrdTypeError.
 *
 * @param krdType - The offending `krd.type` value.
 * @param adapterName - The name of the rejecting adapter (e.g. "tcx").
 */
export const createUnsupportedKrdTypeError = (
  krdType: FileType,
  adapterName: string
): UnsupportedKrdTypeError => new UnsupportedKrdTypeError(krdType, adapterName);
