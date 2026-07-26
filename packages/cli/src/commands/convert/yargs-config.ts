import type { Argv } from "yargs";

import { t } from "../../i18n/index.js";
import { FORMAT_CODES } from "../../utils/format-registry";
import { convertCommand } from "./index";
import type { ConvertOptions } from "./types";

export const convertYargsConfig = {
  command: "convert",
  describe: t("commands.convert"),
  builder: (yargs: Argv) => {
    return yargs
      .option("input", {
        alias: "i",
        type: "string" as const,
        description: t("options.convert.input"),
        demandOption: true,
      })
      .option("output", {
        alias: "o",
        type: "string" as const,
        description: t("options.convert.output"),
      })
      .option("output-dir", {
        type: "string" as const,
        description: t("options.convert.outputDir"),
      })
      .option("input-format", {
        type: "string" as const,
        choices: FORMAT_CODES,
        description: t("options.convert.inputFormat"),
      })
      .option("output-format", {
        type: "string" as const,
        choices: FORMAT_CODES,
        description: t("options.convert.outputFormat"),
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
