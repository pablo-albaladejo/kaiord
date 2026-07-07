type Bounds = { low?: number; high?: number };

const NUMBER = "([+-]?\\d+(?:[.,]\\d+)?)";
const RANGE = new RegExp(`^${NUMBER}\\s*[-–—]\\s*${NUMBER}$`);
const LESS_THAN = new RegExp(`^[<≤]\\s*${NUMBER}$`);
const GREATER_THAN = new RegExp(`^[>≥]\\s*${NUMBER}$`);

const toNumber = (raw: string): number => Number(raw.replace(",", "."));

/**
 * Parse a printed reference range into numeric bounds. Recognizes
 * `"low-high"`, `"< high"`, and `"> low"` (with unicode dashes and
 * `≤ / ≥`). Returns `undefined` for text that carries no numeric bounds
 * (e.g. `"negativo"`), so the caller can flag the value as `"unknown"`.
 */
export function parseRefTextBounds(refText: string): Bounds | undefined {
  const text = refText.trim();
  const range = RANGE.exec(text);
  const low = range?.[1];
  const high = range?.[2];
  if (low !== undefined && high !== undefined) {
    return { low: toNumber(low), high: toNumber(high) };
  }
  const lessThan = LESS_THAN.exec(text)?.[1];
  if (lessThan !== undefined) return { high: toNumber(lessThan) };
  const greaterThan = GREATER_THAN.exec(text)?.[1];
  if (greaterThan !== undefined) return { low: toNumber(greaterThan) };
  return undefined;
}
