import type { Argv } from "yargs";

import { FORMAT_CODES } from "../../utils/format-registry";
import { convertCommand } from "./index";
import type { ConvertOptions } from "./types";

export const convertYargsConfig = {
  command: "convert",
  describe: "Convert workout files between formats",
  builder: (yargs: Argv) => {
    return yargs
      .option("input", {
        alias: "i",
        type: "string" as const,
        description: "Input file path or glob pattern",
        demandOption: true,
      })
      .option("output", {
        alias: "o",
        type: "string" as const,
        description: "Output file path",
      })
      .option("output-dir", {
        type: "string" as const,
        description: "Output directory for batch conversion",
      })
      .option("input-format", {
        type: "string" as const,
        choices: FORMAT_CODES,
        description: "Override input format detection",
      })
      .option("output-format", {
        type: "string" as const,
        choices: FORMAT_CODES,
        description: "Override output format detection",
      })
      .example("$0 convert -i workout.fit -o workout.krd", "Convert FIT to KRD")
      .example("$0 convert -i workout.krd -o workout.fit", "Convert KRD to FIT")
      .example(
        '$0 convert -i "workouts/*.fit" --output-dir converted/',
        "Batch convert all FIT files"
      );
  },
  handler: async (argv: Record<string, unknown>) => {
    const exitCode = await convertCommand(argv as unknown as ConvertOptions);
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  },
};
