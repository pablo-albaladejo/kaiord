import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import type { BinaryReader, BinaryWriter } from "../../ports/format-strategy";
import type { Logger } from "../../ports/logger";
import { compareKRDs } from "./compare-krds";

export type RoundTripDeps = {
  binaryReader: BinaryReader;
  binaryWriter: BinaryWriter;
  toleranceChecker: ToleranceChecker;
  logger: Logger;
};

const logOutcome = (
  logger: Logger,
  label: string,
  violations: Array<ToleranceViolation>
): void => {
  if (violations.length === 0) {
    logger.info(`${label} round-trip validation passed`);
  } else {
    logger.warn(`${label} round-trip validation failed`, {
      violationCount: violations.length,
    });
  }
};

/** Validates a binary → KRD → binary round-trip stays within tolerance. */
export const runBinaryRoundTrip = async (
  { binaryReader, binaryWriter, toleranceChecker, logger }: RoundTripDeps,
  originalBinary: Uint8Array
): Promise<Array<ToleranceViolation>> => {
  logger.info("Validating binary → KRD → binary round-trip");

  const krd = await binaryReader(originalBinary);
  const convertedBinary = await binaryWriter(krd);
  const krd2 = await binaryReader(convertedBinary);

  const violations = compareKRDs(krd, krd2, toleranceChecker, logger);
  logOutcome(logger, "binary → KRD → binary", violations);
  return violations;
};

/** Validates a KRD → binary → KRD round-trip stays within tolerance. */
export const runKrdRoundTrip = async (
  { binaryReader, binaryWriter, toleranceChecker, logger }: RoundTripDeps,
  originalKrd: KRD
): Promise<Array<ToleranceViolation>> => {
  logger.info("Validating KRD → binary → KRD round-trip");

  const binary = await binaryWriter(originalKrd);
  const convertedKrd = await binaryReader(binary);
  const binary2 = await binaryWriter(convertedKrd);
  const krd2 = await binaryReader(binary2);

  const violations = compareKRDs(originalKrd, krd2, toleranceChecker, logger);
  logOutcome(logger, "KRD → binary → KRD", violations);
  return violations;
};
