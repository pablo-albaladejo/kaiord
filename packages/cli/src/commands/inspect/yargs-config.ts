import type { Argv } from "yargs";

import { t } from "../../i18n/index.js";
import { ExitCode } from "../../utils/exit-codes";
import { inspectCommand } from "./index";

export const inspectYargsConfig = {
  command: "inspect",
  describe: t("commands.inspect"),
  builder: (yargs: Argv) => {
    return yargs
      .option("input", {
        alias: "i",
        type: "string" as const,
        description: t("options.inspect.input"),
        demandOption: true,
      })
      .option("input-format", {
        type: "string" as const,
        description: t("options.inspect.inputFormat"),
      })
      .example("$0 inspect -i workout.fit", "Display a summary of the file")
      .example("$0 inspect -i workout.fit --json", "Output full KRD JSON");
  },
  handler: async (argv: Record<string, unknown>) => {
    const exitCode = await inspectCommand(argv);
    if (exitCode !== ExitCode.SUCCESS) {
      process.exit(exitCode);
    }
  },
};
