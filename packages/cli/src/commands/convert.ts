import type { KRD } from "@kaiord/core";
import {
  createDefaultProviders,
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
import chalk from "chalk";
import ora from "ora";
import { basename, join } from "path";
import { z } from "zod";
import { formatError } from "../utils/error-formatter";
import { findFiles, readFile, writeFile } from "../utils/file-handler";
import {
  detectFormat,
  fileFormatSchema,
  type FileFormat,
} from "../utils/format-detector";
import { createLogger } from "../utils/logger-factory";

const convertOptionsSchema = z.object({
  input: z.string(),
  output: z.string().optional(),
  outputDir: z.string().optional(),
  inputFormat: fileFormatSchema.optional(),
  outputFormat: fileFormatSchema.optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type ConvertOptions = z.infer<typeof convertOptionsSchema>;

type ConversionResult = {
  success: boolean;
  inputFile: string;
  outputFile?: string;
  error?: string;
};

/**
 * Detect if input contains glob patterns
 */
const isBatchMode = (input: string): boolean => {
  return input.includes("*") || input.includes("?");
};

/**
 * Convert a single file
 */
const convertSingleFile = async (
  inputFile: string,
  outputFile: string,
  inputFormat: string,
  outputFormat: string,
  providers: ReturnType<typeof createDefaultProviders>
): Promise<void> => {
  // Read input file
  const inputData = await readFile(inputFile, inputFormat as FileFormat);

  // Convert to KRD first
  let krd: KRD;

  if (inputFormat === "fit") {
    if (!(inputData instanceof Uint8Array)) {
      throw new Error("FIT input must be Uint8Array");
    }
    krd = await providers.convertFitToKrd({ fitBuffer: inputData });
  } else if (inputFormat === "tcx") {
    if (typeof inputData !== "string") {
      throw new Error("TCX input must be string");
    }
    krd = await providers.convertTcxToKrd({ tcxString: inputData });
  } else if (inputFormat === "zwo") {
    if (typeof inputData !== "string") {
      throw new Error("ZWO input must be string");
    }
    krd = await providers.convertZwiftToKrd({ zwiftString: inputData });
  } else if (inputFormat === "krd") {
    if (typeof inputData !== "string") {
      throw new Error("KRD input must be string");
    }
    krd = JSON.parse(inputData) as KRD;
  } else {
    throw new Error(`Unsupported input format: ${inputFormat}`);
  }

  // Convert from KRD to output format
  let outputData: Uint8Array | string;

  if (outputFormat === "fit") {
    outputData = await providers.convertKrdToFit({ krd });
  } else if (outputFormat === "tcx") {
    outputData = await providers.convertKrdToTcx({ krd });
  } else if (outputFormat === "zwo") {
    outputData = await providers.convertKrdToZwift({ krd });
  } else if (outputFormat === "krd") {
    outputData = JSON.stringify(krd, null, 2);
  } else {
    throw new Error(`Unsupported output format: ${outputFormat}`);
  }

  // Write output file
  await writeFile(outputFile, outputData, outputFormat as FileFormat);
};

export const convertCommand = async (
  options: ConvertOptions
): Promise<void> => {
  // Parse and validate command options using Zod schemas
  const validatedOptions = convertOptionsSchema.parse(options);

  // Create logger using logger-factory based on options
  const logger = await createLogger({
    type: validatedOptions.logFormat,
    level: validatedOptions.verbose
      ? "debug"
      : validatedOptions.quiet
        ? "error"
        : "info",
    quiet: validatedOptions.quiet,
  });

  // Wrap conversion logic in try-catch block
  try {
    // Check for batch mode
    const batchMode = isBatchMode(validatedOptions.input);

    if (batchMode) {
      // Batch mode requires --output-dir
      if (!validatedOptions.outputDir) {
        const error = new Error("Batch mode requires --output-dir flag");
        error.name = "InvalidArgumentError";
        throw error;
      }

      // Detect output format from outputDir or use explicit format
      const outputFormat = validatedOptions.outputFormat;
      if (!outputFormat) {
        const error = new Error(
          "Batch mode requires --output-format flag to specify target format"
        );
        error.name = "InvalidArgumentError";
        throw error;
      }

      // Get providers
      const providers = createDefaultProviders(logger);

      // Track start time for performance measurement
      const startTime = Date.now();

      // Expand glob patterns using findFiles utility
      const files = await findFiles(validatedOptions.input);

      if (files.length === 0) {
        const error = new Error(
          `No files found matching pattern: ${validatedOptions.input}`
        );
        error.name = "InvalidArgumentError";
        throw error;
      }

      logger.debug("Batch conversion started", {
        pattern: validatedOptions.input,
        fileCount: files.length,
        outputDir: validatedOptions.outputDir,
        outputFormat,
      });

      // Handle TTY detection to disable spinners in non-interactive mode
      const isTTY =
        process.stdout.isTTY &&
        !validatedOptions.quiet &&
        !validatedOptions.json;
      const spinner = isTTY
        ? ora("Processing batch conversion...").start()
        : null;

      // Continue on errors and collect results in array
      const results: Array<ConversionResult> = [];

      // Process files sequentially with for loop
      for (const [index, file] of files.entries()) {
        const fileNum = index + 1;
        const fileName = basename(file);

        // Update spinner text with progress
        if (spinner) {
          spinner.text = `Converting ${fileNum}/${files.length}: ${fileName}`;
        } else {
          logger.info(`Converting ${fileNum}/${files.length}: ${fileName}`);
        }

        try {
          // Detect input format
          const inputFormat =
            validatedOptions.inputFormat || detectFormat(file);

          if (!inputFormat) {
            throw new Error(`Unable to detect format for file: ${file}`);
          }

          // Generate output filename
          const outputFileName = fileName.replace(
            /\.(fit|krd|tcx|zwo)$/i,
            `.${outputFormat}`
          );
          const outputFile = join(validatedOptions.outputDir, outputFileName);

          // Convert single file
          await convertSingleFile(
            file,
            outputFile,
            inputFormat,
            outputFormat,
            providers
          );

          results.push({
            success: true,
            inputFile: file,
            outputFile,
          });
        } catch (error) {
          // Continue processing on error
          results.push({
            success: false,
            inputFile: file,
            error: error instanceof Error ? error.message : String(error),
          });

          logger.error(`Failed to convert ${file}`, { error });
        }
      }

      // Calculate total processing time
      const totalTime = Date.now() - startTime;

      // Collect successful and failed conversions
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      // Display summary
      if (spinner) {
        spinner.stop();
      }

      // Format summary with colors
      if (!validatedOptions.json) {
        console.log("\nBatch conversion complete:");
        console.log(
          chalk.green(`  ✓ Successful: ${successful.length}/${files.length}`)
        );
        if (failed.length > 0) {
          console.log(
            chalk.red(`  ✗ Failed: ${failed.length}/${files.length}`)
          );
        }
        console.log(`  Total time: ${(totalTime / 1000).toFixed(2)}s`);

        // Report all errors at the end
        if (failed.length > 0) {
          console.log(chalk.red("\nFailed conversions:"));
          for (const result of failed) {
            console.log(chalk.red(`  ${result.inputFile}: ${result.error}`));
          }
        }
      } else {
        // JSON output
        console.log(
          JSON.stringify(
            {
              success: failed.length === 0,
              total: files.length,
              successful: successful.length,
              failed: failed.length,
              totalTime,
              results,
            },
            null,
            2
          )
        );
      }

      // Exit with error if any conversions failed
      if (failed.length > 0) {
        process.exit(1);
      }
    } else {
      // Single file mode
      // Detect input/output formats using format-detector utility
      const inputFormat =
        validatedOptions.inputFormat || detectFormat(validatedOptions.input);

      if (!inputFormat) {
        const error = new Error(
          `Unable to detect input format from file: ${validatedOptions.input}. ` +
            `Supported formats: .fit, .krd, .tcx, .zwo`
        );
        error.name = "InvalidArgumentError";
        throw error;
      }

      if (!validatedOptions.output) {
        const error = new Error("Output file is required");
        error.name = "InvalidArgumentError";
        throw error;
      }

      const outputFormat =
        validatedOptions.outputFormat || detectFormat(validatedOptions.output);

      if (!outputFormat) {
        const error = new Error(
          `Unable to detect output format from file: ${validatedOptions.output}. ` +
            `Supported formats: .fit, .krd, .tcx, .zwo`
        );
        error.name = "InvalidArgumentError";
        throw error;
      }

      // Get providers from @kaiord/core using createDefaultProviders(logger)
      const providers = createDefaultProviders(logger);

      logger.debug("Convert command initialized", {
        input: validatedOptions.input,
        output: validatedOptions.output,
        inputFormat,
        outputFormat,
      });

      // Handle TTY detection to disable spinners in non-interactive mode
      const isTTY =
        process.stdout.isTTY &&
        !validatedOptions.quiet &&
        !validatedOptions.json;
      const spinner = isTTY ? ora("Converting...").start() : null;

      try {
        await convertSingleFile(
          validatedOptions.input,
          validatedOptions.output,
          inputFormat,
          outputFormat,
          providers
        );

        // Display success message with ora spinner/progress indicator
        if (validatedOptions.json) {
          // JSON output to stdout
          console.log(
            JSON.stringify(
              {
                success: true,
                inputFile: validatedOptions.input,
                outputFile: validatedOptions.output,
                inputFormat,
                outputFormat,
              },
              null,
              2
            )
          );
        } else if (spinner) {
          spinner.succeed(
            `Conversion complete: ${validatedOptions.input} → ${validatedOptions.output}`
          );
        } else {
          logger.info("Conversion complete", {
            input: validatedOptions.input,
            output: validatedOptions.output,
          });
        }
      } catch (error) {
        if (spinner) {
          spinner.fail("Conversion failed");
        }
        throw error;
      }
    }
  } catch (error) {
    // Catch domain errors from @kaiord/core and format them
    // Log errors using logger before exiting
    logger.error("Conversion failed", { error });

    // Format errors using error-formatter utility
    const formattedError = formatError(error, {
      json: validatedOptions.json,
    });

    // Display helpful error messages with suggestions
    if (validatedOptions.json) {
      console.log(formattedError);
    } else {
      console.error(formattedError);
    }

    // Set appropriate exit codes per CLI spec
    let exitCode = 99; // Unknown error code

    if (error instanceof Error) {
      if (error.message.includes("File not found")) {
        exitCode = 2; // File not found (Requirement 2.4)
      } else if (error.message.includes("Permission denied")) {
        exitCode = 3; // Permission error (Requirement 3.4)
      } else if (error instanceof FitParsingError) {
        exitCode = 4; // Parsing error (Requirement 2.5)
      } else if (error instanceof KrdValidationError) {
        exitCode = 5; // Validation error (Requirement 3.3)
      } else if (error instanceof ToleranceExceededError) {
        exitCode = 6; // Tolerance exceeded (Requirement 7.3)
      } else if (error.name === "InvalidArgumentError") {
        exitCode = 1; // Invalid arguments (Requirements 2.4, 4.5, 5.4)
      }
    }

    process.exit(exitCode);
  }
};
