import type { Argv } from "yargs";

import { t } from "../../i18n/index.js";
import { ExitCode } from "../../utils/exit-codes";
import { FORMAT_CODES } from "../../utils/format-registry";
import { createLogger } from "../../utils/logger-factory";
import { listCommand } from "./list";
import { loginCommand } from "./login";
import { logoutCommand } from "./logout";
import { pushCommand } from "./push";

const buildLogger = (argv: Record<string, unknown>) =>
  createLogger({
    level: argv.verbose ? "debug" : argv.quiet ? "error" : "info",
    quiet: argv.quiet as boolean | undefined,
  });

export const loginSubcommand = {
  command: "login",
  describe: t("commands.garminLogin"),
  builder: (yargs: Argv) =>
    yargs
      .option("email", {
        alias: "e",
        type: "string" as const,
        description: t("options.garminLogin.email"),
        demandOption: true,
      })
      .option("password", {
        alias: "p",
        type: "string" as const,
        description: t("options.garminLogin.password"),
        demandOption: true,
      }),
  handler: async (argv: Record<string, unknown>) => {
    const logger = await buildLogger(argv);
    const exitCode = await loginCommand(argv, logger);
    if (exitCode !== ExitCode.SUCCESS) process.exit(exitCode);
  },
};

export const logoutSubcommand = {
  command: "logout",
  describe: t("commands.garminLogout"),
  builder: (yargs: Argv) => yargs,
  handler: async (argv: Record<string, unknown>) => {
    const logger = await buildLogger(argv);
    const exitCode = await logoutCommand(logger, argv.json as boolean);
    if (exitCode !== ExitCode.SUCCESS) process.exit(exitCode);
  },
};

export const listSubcommand = {
  command: "list",
  describe: t("commands.garminList"),
  builder: (yargs: Argv) =>
    yargs
      .option("limit", {
        alias: "l",
        type: "number" as const,
        description: t("options.garminList.limit"),
        default: 20,
      })
      .option("offset", {
        type: "number" as const,
        description: t("options.garminList.offset"),
        default: 0,
      }),
  handler: async (argv: Record<string, unknown>) => {
    const logger = await buildLogger(argv);
    const exitCode = await listCommand(argv, logger);
    if (exitCode !== ExitCode.SUCCESS) process.exit(exitCode);
  },
};

export const pushSubcommand = {
  command: "push",
  describe: t("commands.garminPush"),
  builder: (yargs: Argv) =>
    yargs
      .option("input", {
        alias: "i",
        type: "string" as const,
        description: t("options.garminPush.input"),
        demandOption: true,
      })
      .option("input-format", {
        type: "string" as const,
        choices: FORMAT_CODES,
        description: t("options.garminPush.inputFormat"),
      }),
  handler: async (argv: Record<string, unknown>) => {
    const logger = await buildLogger(argv);
    const exitCode = await pushCommand(argv, logger);
    if (exitCode !== ExitCode.SUCCESS) process.exit(exitCode);
  },
};
