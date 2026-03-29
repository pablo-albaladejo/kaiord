import { extractPowerFromExtensions } from "./step-helpers";
import { convertTcxTarget } from "../target/target.mapper";
import type { Logger, Target } from "@kaiord/core";

export const convertTargetWithExtensions = (
  tcxStep: Record<string, unknown>,
  extensions: Record<string, unknown> | undefined,
  logger: Logger
): Target | null => {
  const target = convertTcxTarget(
    tcxStep.Target as Record<string, unknown> | undefined,
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
