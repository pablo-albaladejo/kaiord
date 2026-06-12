import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import type { BinaryReader, BinaryWriter } from "../../ports/format-strategy";
import type { Logger } from "../../ports/logger";
import {
  type RoundTripDeps,
  runBinaryRoundTrip,
  runKrdRoundTrip,
} from "./round-trip-validators";

/**
 * TypeScript type for the validateRoundTrip use case function.
 *
 * Automatically inferred from the {@link validateRoundTrip} factory function.
 */
export type ValidateRoundTrip = ReturnType<typeof validateRoundTrip>;

/**
 * Validates round-trip conversion between a binary format and KRD.
 *
 * Format-agnostic in mechanism: it depends only on the injected
 * `BinaryReader`/`BinaryWriter` ports, so it validates any binary adapter
 * (FIT today). It exposes `validateBinaryRoundTrip` (binary → KRD → binary)
 * and `validateKrdRoundTrip` (KRD → binary → KRD), each returning the
 * tolerance violations found. Default tolerances: time ±1 s, power ±1 W or
 * ±1% FTP, heart rate ±1 bpm, cadence ±1 rpm.
 *
 * @param binaryReader - binary-format reader implementation
 * @param binaryWriter - binary-format writer implementation
 * @param toleranceChecker - tolerance checker with configured thresholds
 * @param logger - logger for operation tracking
 */
export const validateRoundTrip = (
  binaryReader: BinaryReader,
  binaryWriter: BinaryWriter,
  toleranceChecker: ToleranceChecker,
  logger: Logger
) => {
  const deps: RoundTripDeps = {
    binaryReader,
    binaryWriter,
    toleranceChecker,
    logger,
  };

  const validateBinaryRoundTrip = (params: {
    originalBinary: Uint8Array;
  }): Promise<Array<ToleranceViolation>> =>
    runBinaryRoundTrip(deps, params.originalBinary);

  const validateKrdRoundTrip = (params: {
    originalKrd: KRD;
  }): Promise<Array<ToleranceViolation>> =>
    runKrdRoundTrip(deps, params.originalKrd);

  return {
    validateBinaryRoundTrip,
    validateKrdRoundTrip,
    /** @deprecated Use {@link validateBinaryRoundTrip}; the reader/writer are format-agnostic binary ports, not FIT-specific. */
    validateFitToKrdToFit: (params: { originalFit: Uint8Array }) =>
      runBinaryRoundTrip(deps, params.originalFit),
    /** @deprecated Use {@link validateKrdRoundTrip}. */
    validateKrdToFitToKrd: (params: { originalKrd: KRD }) =>
      runKrdRoundTrip(deps, params.originalKrd),
  };
};
