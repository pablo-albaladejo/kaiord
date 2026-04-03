import type { Argv } from "yargs";
import { ExitCode } from "../../utils/exit-codes";
import { extractWorkoutCommand } from "./index";

export const extractWorkoutYargsConfig = {
  command: "extract-workout",
  describe: "Extract structured workout from a fitness file as JSON",
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
      .example(
        "$0 extract-workout -i workout.fit",
        "Extract workout JSON from FIT file"
      )
      .example(
        "$0 extract-workout -i workout.krd",
        "Extract workout JSON from KRD file"
      );
  },
  handler: async (argv: Record<string, unknown>) => {
    const exitCode = await extractWorkoutCommand(argv);
    if (exitCode !== ExitCode.SUCCESS) {
      process.exit(exitCode);
    }
  },
};
