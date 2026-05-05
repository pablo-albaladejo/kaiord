import type { Argv } from "yargs";
import {
  listSubcommand,
  loginSubcommand,
  logoutSubcommand,
  pushSubcommand,
} from "./yargs-subcommands";

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
