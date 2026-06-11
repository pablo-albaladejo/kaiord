import type { Duration, Logger } from "@kaiord/core";

import { restoreKaiordDuration } from "./duration-kaiord-restorer";
import { convertStandardTcxDuration } from "./duration-standard-converter";

export const convertTcxDuration = (
  tcxDuration: Record<string, unknown> | undefined,
  logger: Logger
): Duration | null => {
  if (!tcxDuration) {
    return null;
  }

  // First check for kaiord attributes to restore advanced duration types
  const kaiordDuration = restoreKaiordDuration(tcxDuration, logger);
  if (kaiordDuration) {
    return kaiordDuration;
  }

  // Then check for standard TCX duration types
  const standardDuration = convertStandardTcxDuration(tcxDuration);
  if (standardDuration) {
    return standardDuration;
  }

  const durationType = tcxDuration["@_xsi:type"] as string | undefined;
  logger.warn("Unsupported duration type", { durationType });
  return null;
};
