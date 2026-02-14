import type { Argv } from "yargs";
import { ExitCode } from "../../utils/exit-codes";
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

const loginSubcommand = {
  command: "login",
  describe: "Authenticate with Garmin Connect",
  builder: (yargs: Argv) =>
    yargs
      .option("email", {
        alias: "e",
        type: "string" as const,
        description: "Garmin Connect email",
        demandOption: true,
      })
      .option("password", {
        alias: "p",
        type: "string" as const,
        description: "Garmin Connect password",
        demandOption: true,
      }),
  handler: async (argv: Record<string, unknown>) => {
    const logger = await buildLogger(argv);
    const exitCode = await loginCommand(argv, logger);
    if (exitCode !== ExitCode.SUCCESS) process.exit(exitCode);
  },
};

const logoutSubcommand = {
  command: "logout",
  describe: "Log out from Garmin Connect",
  builder: (yargs: Argv) => yargs,
  handler: async (argv: Record<string, unknown>) => {
    const logger = await buildLogger(argv);
    const exitCode = await logoutCommand(logger, argv.json as boolean);
    if (exitCode !== ExitCode.SUCCESS) process.exit(exitCode);
  },
};

const listSubcommand = {
  command: "list",
  describe: "List workouts from Garmin Connect",
  builder: (yargs: Argv) =>
    yargs
      .option("limit", {
        alias: "l",
        type: "number" as const,
        description: "Maximum number of workouts to list",
        default: 20,
      })
      .option("offset", {
        type: "number" as const,
        description: "Number of workouts to skip",
        default: 0,
      }),
  handler: async (argv: Record<string, unknown>) => {
    const logger = await buildLogger(argv);
    const exitCode = await listCommand(argv, logger);
    if (exitCode !== ExitCode.SUCCESS) process.exit(exitCode);
  },
};

const pushSubcommand = {
  command: "push",
  describe: "Push a workout file to Garmin Connect",
  builder: (yargs: Argv) =>
    yargs
      .option("input", {
        alias: "i",
        type: "string" as const,
        description: "Input workout file path",
        demandOption: true,
      })
      .option("input-format", {
        type: "string" as const,
        choices: ["fit", "gcn", "krd", "tcx", "zwo"] as const,
        description: "Override input format detection",
      }),
  handler: async (argv: Record<string, unknown>) => {
    const logger = await buildLogger(argv);
    const exitCode = await pushCommand(argv, logger);
    if (exitCode !== ExitCode.SUCCESS) process.exit(exitCode);
  },
};

export const garminYargsConfig = {
  command: "garmin",
  describe: "Garmin Connect operations (login, logout, list, push)",
  builder: (yargs: Argv) =>
    yargs
      .command(loginSubcommand)
      .command(logoutSubcommand)
      .command(listSubcommand)
      .command(pushSubcommand)
      .demandCommand(1, "Specify a garmin subcommand"),
  handler: () => {},
};
