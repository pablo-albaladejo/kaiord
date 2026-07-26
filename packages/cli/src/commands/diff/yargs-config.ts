import type { Argv } from "yargs";

import { t } from "../../i18n/index.js";
import { ExitCode } from "../../utils/exit-codes";
import { FORMAT_CODES } from "../../utils/format-registry";
import { diffCommand } from "./index";
import type { DiffOptions } from "./types";

export const diffYargsConfig = {
  command: "diff",
  describe: t("commands.diff"),
  builder: (yargs: Argv) => {
    return yargs
      .option("file1", {
        alias: "1",
        type: "string" as const,
        description: t("options.diff.file1"),
        demandOption: true,
      })
      .option("file2", {
        alias: "2",
        type: "string" as const,
        description: t("options.diff.file2"),
        demandOption: true,
      })
      .option("format1", {
        type: "string" as const,
        choices: FORMAT_CODES,
        description: t("options.diff.format1"),
      })
      .option("format2", {
        type: "string" as const,
        choices: FORMAT_CODES,
        description: t("options.diff.format2"),
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
