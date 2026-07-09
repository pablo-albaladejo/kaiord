/**
 * Kaiord CLI - Command-line interface for workout file conversion
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { t } from "../i18n/index.js";
import { mapErrorToExitCode } from "../utils/error-exit-code.js";
import { formatError } from "../utils/error-formatter.js";
import { ExitCode } from "../utils/exit-codes.js";
import { registerCommands } from "./register-commands.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, "../../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

const main = async (): Promise<void> => {
  try {
    const cli = yargs(hideBin(process.argv))
      .scriptName("kaiord")
      .usage("$0 <command> [options]");

    await registerCommands(cli)
      .option("verbose", {
        type: "boolean",
        description: t("options.global.verbose"),
        global: true,
      })
      .option("quiet", {
        type: "boolean",
        description: t("options.global.quiet"),
        global: true,
      })
      .option("json", {
        type: "boolean",
        description: t("options.global.json"),
        global: true,
      })
      .option("log-format", {
        type: "string",
        choices: ["pretty", "structured"],
        description: t("options.global.logFormat"),
        global: true,
      })
      .version(version)
      .alias("version", "v")
      .help()
      .alias("help", "h")
      .demandCommand(1, t("output.mustSpecifyCommand"))
      .strict()
      .parse();
  } catch (error) {
    const formattedError = formatError(error, { json: false });
    console.error(formattedError);

    process.exit(mapErrorToExitCode(error));
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
