import type { Logger, ToleranceConfig } from "@kaiord/core";
import {
  createToleranceChecker,
  toleranceConfigSchema,
  validateRoundTrip,
} from "@kaiord/core";
import { createFitReader, createFitWriter } from "@kaiord/fit";
import { readFile as fsReadFile } from "fs/promises";

import { UnsupportedFormatError } from "../../utils/cli-errors.js";
import { readFile } from "../../utils/file-handler.js";
import { detectFormat } from "../../utils/format-detector.js";
import type { ValidateOptions } from "./types";

const loadToleranceConfig = async (
  configPath: string,
  logger: Logger
): Promise<ToleranceConfig> => {
  logger.debug("Loading custom tolerance config", { path: configPath });
  const configContent = await fsReadFile(configPath, "utf-8");
  const configJson = JSON.parse(configContent);
  const toleranceConfig = toleranceConfigSchema.parse(configJson);
  logger.debug("Custom tolerance config loaded", { config: toleranceConfig });
  return toleranceConfig;
};

export const executeValidation = async (
  opts: ValidateOptions,
  logger: Logger
) => {
  const format = detectFormat(opts.input);
  if (!format) {
    throw new UnsupportedFormatError(
      `Unable to detect format from file: ${opts.input}`
    );
  }

  if (format !== "fit") {
    throw new UnsupportedFormatError(
      `Validation currently only supports FIT files. Got: ${format}`
    );
  }

  logger.debug("Reading input file", { path: opts.input, format });
  const inputData = await readFile(opts.input, format);

  if (typeof inputData === "string") {
    throw new Error("Expected binary data for FIT file");
  }

  const toleranceConfig = opts.toleranceConfig
    ? await loadToleranceConfig(opts.toleranceConfig, logger)
    : undefined;

  const toleranceChecker = createToleranceChecker(toleranceConfig);
  const roundTripValidator = validateRoundTrip(
    createFitReader(logger),
    createFitWriter(logger),
    toleranceChecker,
    logger
  );

  logger.info("Starting round-trip validation", { file: opts.input });
  return roundTripValidator.validateFitToKrdToFit({ originalFit: inputData });
};
