import type { NumberCheck } from "./types";

const SCALARS = ["seconds", "meters", "paceMps", "percentMax"] as const;

const positive = (n: number) => Number.isFinite(n) && n > 0;

/**
 * A number check that names no number, or one no step can carry, asserts
 * nothing while looking like an assertion; a reversed range matches nothing.
 */
export const numberCheckViolation = (check: NumberCheck): string | null => {
  const named = SCALARS.filter((k) => check[k] !== undefined);
  if (named.length === 0 && !check.paceRange)
    return "an expectedNumbers check names no number";
  const bad = named.find((k) => !positive(check[k] as number));
  if (bad)
    return `expectedNumbers ${bad} ${check[bad]} is not a positive number`;
  const range = check.paceRange;
  if (range && !(positive(range.min) && positive(range.max)))
    return "expectedNumbers paceRange needs positive bounds";
  if (range && range.min > range.max)
    return `expectedNumbers paceRange min ${range.min} is above max ${range.max}`;
  return null;
};
