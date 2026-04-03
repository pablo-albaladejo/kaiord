import type { Argv } from "yargs";
import { ExitCode } from "../../utils/exit-codes";
import { inspectCommand } from "./index";

export const inspectYargsConfig = {
  command: "inspect",
  describe: "Inspect a fitness file and display a summary or full KRD JSON",
  builder: (yargs: Argv) => {
    return yargs
      .option("input", {
        alias: "i",
        type: "string" as const,
        description: "Input file path",
        demandOption: true,
      })
      .option("input-format", {
        type: "string" as const,
        description:
          "Override input format detection (fit, tcx, zwo, gcn, krd)",
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
