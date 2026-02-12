import type { Argv } from "yargs";
import { ExitCode } from "../../utils/exit-codes";
import type { DiffOptions } from "./types";
import { diffCommand } from "./index";

export const diffYargsConfig = {
  command: "diff",
  describe: "Compare two workout files and show differences",
  builder: (yargs: Argv) => {
    return yargs
      .option("file1", {
        alias: "1",
        type: "string" as const,
        description: "First file to compare",
        demandOption: true,
      })
      .option("file2", {
        alias: "2",
        type: "string" as const,
        description: "Second file to compare",
        demandOption: true,
      })
      .option("format1", {
        type: "string" as const,
        choices: ["fit", "gcn", "krd", "tcx", "zwo"] as const,
        description: "Override format detection for first file",
      })
      .option("format2", {
        type: "string" as const,
        choices: ["fit", "gcn", "krd", "tcx", "zwo"] as const,
        description: "Override format detection for second file",
      })
      .example(
        "$0 diff --file1 workout1.fit --file2 workout2.fit",
        "Compare two FIT files"
      )
      .example(
        "$0 diff --file1 workout.fit --file2 workout.krd",
        "Compare FIT and KRD files"
      )
      .example(
        "$0 diff --file1 workout1.krd --file2 workout2.krd --json",
        "Compare with JSON output"
      );
  },
  handler: async (argv: Record<string, unknown>) => {
    const exitCode = await diffCommand(argv as unknown as DiffOptions);
    if (exitCode !== ExitCode.SUCCESS) {
      process.exit(exitCode);
    }
  },
};
