import type { Logger } from "@kaiord/core";
import type { Ora } from "ora";

import { t } from "../../i18n/index.js";

type ReportArgs = {
  input: string;
  output: string;
  inputFormat: string;
  outputFormat: string;
  json: boolean | undefined;
  spinner: Ora | null;
  logger: Logger;
};

/**
 * Reports a successful single-file conversion through the appropriate channel:
 * JSON to stdout, spinner success line, or structured logger info.
 */
export const reportConversionSuccess = ({
  input,
  output,
  inputFormat,
  outputFormat,
  json,
  spinner,
  logger,
}: ReportArgs): void => {
  if (json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          inputFile: input,
          outputFile: output,
          inputFormat,
          outputFormat,
        },
        null,
        2
      )
    );
    return;
  }

  if (spinner) {
    spinner.succeed(t("output.conversionComplete", { input, output }));
    return;
  }

  logger.info("Conversion complete", { input, output });
};
