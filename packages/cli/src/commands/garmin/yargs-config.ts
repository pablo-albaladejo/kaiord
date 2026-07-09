import type { Argv } from "yargs";

import { t } from "../../i18n/index.js";
import {
  listSubcommand,
  loginSubcommand,
  logoutSubcommand,
  pushSubcommand,
} from "./yargs-subcommands";

export const garminYargsConfig = {
  command: "garmin",
  describe: t("commands.garmin"),
  builder: (yargs: Argv) =>
    yargs
      .command(loginSubcommand)
      .command(logoutSubcommand)
      .command(listSubcommand)
      .command(pushSubcommand)
      .demandCommand(1, t("output.specifyGarminSubcommand")),
  handler: () => {},
};
