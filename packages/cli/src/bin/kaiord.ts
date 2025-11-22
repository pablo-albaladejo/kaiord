/**
 * Kaiord CLI - Command-line interface for workout file conversion
 */

import chalk from "chalk";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { convertCommand } from "../commands/convert.js";
import { validateCommand } from "../commands/validate.js";
import { formatError } from "../utils/error-formatter.js";

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

const showKiroEasterEgg = (): void => {
  console.log(
    chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   👻 Built with Kiro AI during Kiroween Hackathon 👻    ║
║                                                           ║
║   Kiro helped design, architect, and implement this      ║
║   entire CLI tool through spec-driven development.       ║
║                                                           ║
║   Learn more about Kiroween:                             ║
║   👉 http://kiroween.devpost.com/                        ║
║                                                           ║
║   Kiro: Your AI pair programmer for building better      ║
║   software, faster. 🚀                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `)
  );
  process.exit(0);
};

const main = async (): Promise<void> => {
  try {
    // Check for easter egg flags before yargs processes them
    const args = process.argv.slice(2);
    if (args.includes("--kiro") || args.includes("--kiroween")) {
      showKiroEasterEgg();
    }

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
          await convertCommand({
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
        }
      )
      .command(
        "validate",
        "Validate round-trip conversion of workout files",
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
          await validateCommand({
            input: argv.input,
            toleranceConfig: argv.toleranceConfig,
            verbose: argv.verbose as boolean | undefined,
            quiet: argv.quiet as boolean | undefined,
            json: argv.json as boolean | undefined,
            logFormat: argv.logFormat as "pretty" | "structured" | undefined,
          });
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
        process.exit(4);
      } else if (errorName === "KrdValidationError") {
        process.exit(5);
      } else if (errorName === "ToleranceExceededError") {
        process.exit(6);
      }
    }

    // Unknown error
    process.exit(99);
  }
};

// Handle unhandled rejections
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(99);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(99);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(99);
});
