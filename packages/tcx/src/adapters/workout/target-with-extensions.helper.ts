import type { Logger, Sport, Target } from "@kaiord/core";

import { convertTcxTarget } from "../target/tcx-target-walker.converter";
import { extractPowerFromExtensions } from "./step-helpers";

export const convertTargetWithExtensions = (
  tcxStep: Record<string, unknown>,
  extensions: Record<string, unknown> | undefined,
  sport: Sport,
  logger: Logger
): Target | null => {
  const target = convertTcxTarget(
    tcxStep.Target as Record<string, unknown> | undefined,
    sport,
    logger
  );
  if (!target) return null;

  if (target.type === "open" && extensions) {
    const powerWatts = extractPowerFromExtensions(extensions, logger);
    if (powerWatts !== undefined) {
      logger.debug("Converting open target to power target from extensions", {
        watts: powerWatts,
      });
      return {
        type: "power",
        value: {
          unit: "watts",
          value: powerWatts,
        },
      };
    }
  }

  return target;
};
