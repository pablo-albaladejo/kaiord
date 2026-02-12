import type { Argv } from "yargs";
import { ExitCode } from "../../utils/exit-codes";
import { validateCommand } from "./index";

export const validateYargsConfig = {
  command: "validate",
  describe: "Validate round-trip conversion of FIT files (FIT only)",
  builder: (yargs: Argv) => {
    return yargs
      .option("input", {
        alias: "i",
        type: "string" as const,
        description: "Input file path",
        demandOption: true,
      })
      .option("tolerance-config", {
        type: "string" as const,
        description: "Path to custom tolerance configuration JSON",
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
