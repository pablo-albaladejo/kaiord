/**
 * Kaiord CLI - Command-line interface for workout file conversion
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { convertYargsConfig } from "../commands/convert/yargs-config.js";
import { diffYargsConfig } from "../commands/diff/yargs-config.js";
import { validateYargsConfig } from "../commands/validate/yargs-config.js";
import { formatError } from "../utils/error-formatter.js";
import { ExitCode } from "../utils/exit-codes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, "../../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

const main = async (): Promise<void> => {
  try {
    await yargs(hideBin(process.argv))
      .scriptName("kaiord")
      .usage("$0 <command> [options]")
      .command(
        convertYargsConfig.command,
        convertYargsConfig.describe,
        convertYargsConfig.builder,
        convertYargsConfig.handler
      )
      .command(
        validateYargsConfig.command,
        validateYargsConfig.describe,
        validateYargsConfig.builder,
        validateYargsConfig.handler
      )
      .command(
        diffYargsConfig.command,
        diffYargsConfig.describe,
        diffYargsConfig.builder,
        diffYargsConfig.handler
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
    const formattedError = formatError(error, { json: false });
    console.error(formattedError);

    if (error && typeof error === "object" && "name" in error) {
      const errorName = (error as { name: string }).name;
      if (
        errorName === "FitParsingError" ||
        errorName === "GarminParsingError"
      ) {
        process.exit(ExitCode.PARSING_ERROR);
      } else if (errorName === "KrdValidationError") {
        process.exit(ExitCode.VALIDATION_ERROR);
      } else if (errorName === "ToleranceExceededError") {
        process.exit(ExitCode.TOLERANCE_EXCEEDED);
      } else if (errorName === "InvalidArgumentError") {
        process.exit(ExitCode.INVALID_ARGUMENT);
      }
    }

    process.exit(ExitCode.UNKNOWN_ERROR);
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(ExitCode.UNKNOWN_ERROR);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(ExitCode.UNKNOWN_ERROR);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(ExitCode.UNKNOWN_ERROR);
});
