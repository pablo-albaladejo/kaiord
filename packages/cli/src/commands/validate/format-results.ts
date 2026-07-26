import type { ToleranceViolation } from "@kaiord/core";

import { t } from "../../i18n/index.js";
import { formatToleranceViolations } from "../../utils/error-formatter.js";

export const formatValidationSuccess = (
  opts: { json?: boolean; quiet?: boolean },
  input: string,
  format: string
): void => {
  if (opts.json) {
    console.log(
      JSON.stringify(
        { success: true, file: input, format, violations: [] },
        null,
        2
      )
    );
  } else if (!opts.quiet) {
    console.log(t("output.roundTripPassed"));
  }
};

export const formatValidationFailure = (
  opts: { json?: boolean },
  input: string,
  format: string,
  violations: ToleranceViolation[]
): void => {
  if (opts.json) {
    console.log(
      JSON.stringify(
        { success: false, file: input, format, violations },
        null,
        2
      )
    );
  } else {
    console.error("Round-trip validation failed\n");
    console.error(formatToleranceViolations(violations));
  }
};
