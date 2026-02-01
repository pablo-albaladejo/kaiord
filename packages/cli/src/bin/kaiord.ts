/**
 * Kaiord CLI - Command-line interface for workout file conversion
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { convertCommand } from "../commands/convert.js";
import { diffCommand } from "../commands/diff.js";
import { validateCommand } from "../commands/validate.js";
import { formatError } from "../utils/error-formatter.js";
import { ExitCode } from "../utils/exit-codes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
// In development: src/bin/kaiord.ts -> ../../package.json
// In production: dist/bin/kaiord.js -> ../../package.json
const packageJsonPath = __dirname.includes("/dist")
  ? join(__dirname, "../../package.json")
  : join(__dirname, "../../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

const main = async (): Promise<void> => {
  try {
    await yargs(hideBin(process.argv))
      .scriptName("kaiord")
      .usage("$0 <command> [options]")
      .command(
        "convert",
        "Convert workout files between formats",
        (yargs) => {
          return yargs
            .option("input", {
              alias: "i",
              type: "string",
              description: "Input file path or glob pattern",
              demandOption: true,
            })
            .option("output", {
              alias: "o",
              type: "string",
              description: "Output file path",
            })
            .option("output-dir", {
              type: "string",
              description: "Output directory for batch conversion",
            })
            .option("input-format", {
              type: "string",
              choices: ["fit", "krd", "tcx", "zwo"],
              description: "Override input format detection",
            })
            .option("output-format", {
              type: "string",
              choices: ["fit", "krd", "tcx", "zwo"],
              description: "Override output format detection",
            })
            .example(
              "$0 convert -i workout.fit -o workout.krd",
              "Convert FIT to KRD"
            )
            .example(
              "$0 convert -i workout.krd -o workout.fit",
              "Convert KRD to FIT"
            )
            .example(
              '$0 convert -i "workouts/*.fit" --output-dir converted/',
              "Batch convert all FIT files"
            );
        },
        async (argv) => {
          const exitCode = await convertCommand({
            input: argv.input,
            output: argv.output,
            outputDir: argv.outputDir,
            inputFormat: argv.inputFormat as
              | "fit"
              | "krd"
              | "tcx"
              | "zwo"
              | undefined,
            outputFormat: argv.outputFormat as
              | "fit"
              | "krd"
              | "tcx"
              | "zwo"
              | undefined,
            verbose: argv.verbose as boolean | undefined,
            quiet: argv.quiet as boolean | undefined,
            json: argv.json as boolean | undefined,
            logFormat: argv.logFormat as "pretty" | "structured" | undefined,
          });
          if (exitCode !== 0) {
            process.exit(exitCode);
          }
        }
      )
      .command(
        "validate",
        "Validate round-trip conversion of FIT files (FIT only)",
        (yargs) => {
          return yargs
            .option("input", {
              alias: "i",
              type: "string",
              description: "Input file path",
              demandOption: true,
            })
            .option("tolerance-config", {
              type: "string",
              description: "Path to custom tolerance configuration JSON",
            })
            .example(
              "$0 validate -i workout.fit",
              "Validate round-trip conversion"
            )
            .example(
              "$0 validate -i workout.fit --tolerance-config custom.json",
              "Validate with custom tolerances"
            );
        },
        async (argv) => {
          const exitCode = await validateCommand({
            input: argv.input,
            toleranceConfig: argv.toleranceConfig,
            verbose: argv.verbose as boolean | undefined,
            quiet: argv.quiet as boolean | undefined,
            json: argv.json as boolean | undefined,
            logFormat: argv.logFormat as "pretty" | "structured" | undefined,
          });
          if (exitCode !== ExitCode.SUCCESS) {
            process.exit(exitCode);
          }
        }
      )
      .command(
        "diff",
        "Compare two workout files and show differences",
        (yargs) => {
          return yargs
            .option("file1", {
              alias: "1",
              type: "string",
              description: "First file to compare",
              demandOption: true,
            })
            .option("file2", {
              alias: "2",
              type: "string",
              description: "Second file to compare",
              demandOption: true,
            })
            .option("format1", {
              type: "string",
              choices: ["fit", "krd", "tcx", "zwo"],
              description: "Override format detection for first file",
            })
            .option("format2", {
              type: "string",
              choices: ["fit", "krd", "tcx", "zwo"],
              description: "Override format detection for second file",
            })
            .example(
              "$0 diff --file1 workout1.fit --file2 workout2.fit",
              "Compare two FIT files"
            )
            .example(
              "$0 diff --file1 workout.fit --file2 workout.krd",
              "Compare FIT and KRD files"
            )
            .example(
              "$0 diff --file1 workout1.krd --file2 workout2.krd --json",
              "Compare with JSON output"
            );
        },
        async (argv) => {
          const exitCode = await diffCommand({
            file1: argv.file1,
            file2: argv.file2,
            format1: argv.format1 as "fit" | "krd" | "tcx" | "zwo" | undefined,
            format2: argv.format2 as "fit" | "krd" | "tcx" | "zwo" | undefined,
            verbose: argv.verbose as boolean | undefined,
            quiet: argv.quiet as boolean | undefined,
            json: argv.json as boolean | undefined,
            logFormat: argv.logFormat as "pretty" | "structured" | undefined,
          });
          // Exit code 10 = files different (not an error), 0 = identical
          // Only call process.exit for actual errors
          if (
            exitCode !== ExitCode.SUCCESS &&
            exitCode !== ExitCode.DIFFERENCES_FOUND
          ) {
            process.exit(exitCode);
          }
          // Pass through the exit code for scripting (0 or 10)
          if (exitCode === ExitCode.DIFFERENCES_FOUND) {
            process.exit(exitCode);
          }
        }
      )
      .option("verbose", {
        type: "boolean",
        description: "Enable verbose logging",
        global: true,
      })
      .option("quiet", {
        type: "boolean",
        description: "Suppress all output except errors",
        global: true,
      })
      .option("json", {
        type: "boolean",
        description: "Output results in JSON format",
        global: true,
      })
      .option("log-format", {
        type: "string",
        choices: ["pretty", "structured"],
        description: "Force specific log format",
        global: true,
      })
      .version(version)
      .alias("version", "v")
      .help()
      .alias("help", "h")
      .demandCommand(1, "You must specify a command")
      .strict()
      .parse();
  } catch (error) {
    // Format and display error
    const formattedError = formatError(error, { json: false });
    console.error(formattedError);

    // Map error types to exit codes
    if (error && typeof error === "object" && "name" in error) {
      const errorName = (error as { name: string }).name;
      if (errorName === "FitParsingError") {
        process.exit(ExitCode.PARSING_ERROR);
      } else if (errorName === "KrdValidationError") {
        process.exit(ExitCode.VALIDATION_ERROR);
      } else if (errorName === "ToleranceExceededError") {
        process.exit(ExitCode.TOLERANCE_EXCEEDED);
      } else if (errorName === "InvalidArgumentError") {
        process.exit(ExitCode.INVALID_ARGUMENT);
      }
    }

    // Unknown error
    process.exit(ExitCode.UNKNOWN_ERROR);
  }
};

// Handle unhandled rejections
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(ExitCode.UNKNOWN_ERROR);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(ExitCode.UNKNOWN_ERROR);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(ExitCode.UNKNOWN_ERROR);
});
