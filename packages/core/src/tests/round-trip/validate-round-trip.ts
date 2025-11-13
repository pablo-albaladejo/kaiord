import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import type { FitReader } from "../../ports/fit-reader";
import type { FitWriter } from "../../ports/fit-writer";
import type { Logger } from "../../ports/logger";
import { compareKRDs } from "./compare-krds";

type ValidateFitToKrdToFitParams = {
  originalFit: Uint8Array;
};

type ValidateKrdToFitToKrdParams = {
  originalKrd: KRD;
};

export type ValidateRoundTrip = ReturnType<typeof validateRoundTrip>;

export const validateRoundTrip = (
  fitReader: FitReader,
  fitWriter: FitWriter,
  toleranceChecker: ToleranceChecker,
  logger: Logger
) => ({
  validateFitToKrdToFit: async (
    params: ValidateFitToKrdToFitParams
  ): Promise<Array<ToleranceViolation>> => {
    logger.info("Validating FIT → KRD → FIT round-trip");

    const krd = await fitReader.readToKRD(params.originalFit);
    const convertedFit = await fitWriter.writeFromKRD(krd);
    const krd2 = await fitReader.readToKRD(convertedFit);

    const violations = compareKRDs(krd, krd2, toleranceChecker, logger);

    if (violations.length === 0) {
      logger.info("FIT → KRD → FIT round-trip validation passed");
    } else {
      logger.warn("FIT → KRD → FIT round-trip validation failed", {
        violationCount: violations.length,
      });
    }

    return violations;
  },

  validateKrdToFitToKrd: async (
    params: ValidateKrdToFitToKrdParams
  ): Promise<Array<ToleranceViolation>> => {
    logger.info("Validating KRD → FIT → KRD round-trip");

    const fit = await fitWriter.writeFromKRD(params.originalKrd);
    const convertedKrd = await fitReader.readToKRD(fit);
    const fit2 = await fitWriter.writeFromKRD(convertedKrd);
    const krd2 = await fitReader.readToKRD(fit2);

    const violations = compareKRDs(
      params.originalKrd,
      krd2,
      toleranceChecker,
      logger
    );

    if (violations.length === 0) {
      logger.info("KRD → FIT → KRD round-trip validation passed");
    } else {
      logger.warn("KRD → FIT → KRD round-trip validation failed", {
        violationCount: violations.length,
      });
    }

    return violations;
  },
});
