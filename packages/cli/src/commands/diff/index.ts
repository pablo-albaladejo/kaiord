import { createDefaultProviders } from "@kaiord/core";
import { createFitProviders } from "@kaiord/fit";
import { createTcxProviders } from "@kaiord/tcx";
import { createZwoProviders } from "@kaiord/zwo";
import { loadConfigWithMetadata } from "../../utils/config-loader.js";
import { formatError } from "../../utils/error-formatter.js";
import { ExitCode } from "../../utils/exit-codes.js";
import { loadFileAsKrd } from "../../utils/krd-file-loader.js";
import { createLogger } from "../../utils/logger-factory.js";
import {
  compareExtensions,
  compareMetadata,
  compareSteps,
} from "./comparators";
import { formatDiffPretty } from "./formatter";
import { diffOptionsSchema, type DiffOptions, type DiffResult } from "./types";

export type { DiffOptions } from "./types";

/**
 * Diff command - compare two workout files
 */
export const diffCommand = async (options: DiffOptions): Promise<number> => {
  const validatedOptions = diffOptionsSchema.parse(options);

  const logger = await createLogger({
    type: validatedOptions.logFormat,
    level: validatedOptions.verbose
      ? "debug"
      : validatedOptions.quiet
        ? "error"
        : "info",
    quiet: validatedOptions.quiet,
  });

  // Log config discovery in verbose mode (diff doesn't use config values,
  // but logging helps debug configuration issues)
  const configResult = await loadConfigWithMetadata();
  if (configResult.loadedFrom) {
    logger.debug("Configuration loaded", { path: configResult.loadedFrom });
  } else {
    logger.debug("No configuration file found", {
      searchedPaths: configResult.searchedPaths,
    });
  }

  try {
    const providers = createDefaultProviders(
      {
        fit: createFitProviders(logger),
        tcx: createTcxProviders(logger),
        zwo: createZwoProviders(logger),
      },
      logger
    );

    logger.debug("Loading files for comparison", {
      file1: validatedOptions.file1,
      file2: validatedOptions.file2,
    });

    const krd1 = await loadFileAsKrd(
      validatedOptions.file1,
      validatedOptions.format1,
      providers
    );
    const krd2 = await loadFileAsKrd(
      validatedOptions.file2,
      validatedOptions.format2,
      providers
    );

    logger.debug("Files loaded successfully");

    const metadataDiff = compareMetadata(krd1, krd2);
    const stepsDiff = compareSteps(krd1, krd2);
    const extensionsDiff = compareExtensions(krd1, krd2);

    const identical =
      metadataDiff.length === 0 &&
      stepsDiff.differences.length === 0 &&
      extensionsDiff.differences.length === 0;

    const result: DiffResult = {
      identical,
      metadataDiff: metadataDiff.length > 0 ? metadataDiff : undefined,
      stepsDiff: stepsDiff.differences.length > 0 ? stepsDiff : undefined,
      extensionsDiff:
        extensionsDiff.differences.length > 0 ? extensionsDiff : undefined,
    };

    if (validatedOptions.json) {
      console.log(
        JSON.stringify(
          {
            success: true,
            file1: validatedOptions.file1,
            file2: validatedOptions.file2,
            ...result,
          },
          null,
          2
        )
      );
    } else {
      console.log(
        formatDiffPretty(result, validatedOptions.file1, validatedOptions.file2)
      );
    }

    return identical ? ExitCode.SUCCESS : ExitCode.DIFFERENCES_FOUND;
  } catch (error) {
    logger.error("Diff command failed", { error });

    const formattedError = formatError(error, {
      json: validatedOptions.json,
    });

    if (validatedOptions.json) {
      console.log(formattedError);
    } else {
      console.error(formattedError);
    }

    return ExitCode.UNKNOWN_ERROR;
  }
};
