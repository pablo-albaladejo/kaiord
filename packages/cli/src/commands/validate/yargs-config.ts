import type { Argv } from "yargs";

import { t } from "../../i18n/index.js";
import { ExitCode } from "../../utils/exit-codes";
import { validateCommand } from "./index";

export const validateYargsConfig = {
  command: "validate",
  describe: t("commands.validate"),
  builder: (yargs: Argv) => {
    return yargs
      .option("input", {
        alias: "i",
        type: "string" as const,
        description: t("options.validate.input"),
        demandOption: true,
      })
      .option("tolerance-config", {
        type: "string" as const,
        description: t("options.validate.toleranceConfig"),
      })
      .example("$0 validate -i workout.fit", "Validate round-trip conversion")
      .example(
        "$0 validate -i workout.fit --tolerance-config custom.json",
        "Validate with custom tolerances"
      );
  },
  handler: async (argv: Record<string, unknown>) => {
    const exitCode = await validateCommand(argv);
    if (exitCode !== ExitCode.SUCCESS) {
      process.exit(exitCode);
    }
  },
};
