import type { Logger } from "@kaiord/core";

import type { BandRecipe } from "./trainingpeaks-band-recipe.types";

const PERCENT = 100;

/**
 * Express an absolute value as a percentage of the recipe's threshold, or
 * `undefined` (with a warning) when no usable threshold is known.
 */
export const toPercent = (
  value: number,
  recipe: BandRecipe,
  logger: Logger | undefined,
  context: Record<string, unknown>
): number | undefined => {
  if (recipe.threshold === undefined || recipe.threshold <= 0) {
    logger?.warn(
      `Lossy conversion: dropped ${recipe.label} target — no athlete threshold to express it as a percentage`,
      { ...context, value }
    );
    return undefined;
  }
  return (value / recipe.threshold) * PERCENT;
};
