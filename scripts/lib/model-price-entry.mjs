/**
 * The checks of one entry of `model-prices.json` for
 * `check-model-prices.mjs`: prices or an unpriced reason, a `readOn` within
 * 120 days and not in the future, and the page's own words for its prices.
 *
 * `quote` holds the exact line(s) of the official pricing page the prices
 * were read from. An entry read on or before `QUOTES_REQUIRED_AFTER`, when
 * the table carried no quotes, has `quote: null` and keeps that `readOn`
 * until it expires; renewing `readOn` means reading the page again, so a
 * priced entry read after that day must carry its quote, and every number
 * in its periods must appear in it. Offline: the page is never fetched.
 */
export const MAX_AGE_DAYS = 120;
export const QUOTES_REQUIRED_AFTER = "2026-11-23";

const DAY_MS = 86_400_000;
const NUMBER = /(\d[\d,]*(?:\.\d+)?)\s*([KkM])?(?![A-Za-z])/g;
const SCALE = { K: 1_000, k: 1_000, M: 1_000_000 };
const PRICE_FIELDS = ["input", "output", "cacheRead", "cacheWrite"];

/** Every number a quote states: `$1.25`, `1,000`, `200K`, `200k`, `1M`. */
export const quotedNumbers = (lines) =>
  new Set(
    lines.flatMap((line) =>
      [...line.matchAll(NUMBER)].map(
        ([, digits, suffix]) =>
          Number(digits.replaceAll(",", "")) * (SCALE[suffix] ?? 1)
      )
    )
  );

const periodNumbers = (period) => {
  const tiers = [period, period.longContext].filter(Boolean);
  return [
    ...tiers.flatMap((t) => PRICE_FIELDS.map((f) => t[f])),
    period.longContext?.aboveInputTokens,
  ].filter((n) => typeof n === "number");
};

const isQuote = (quote) =>
  quote === null ||
  (Array.isArray(quote) &&
    quote.length > 0 &&
    quote.every((line) => typeof line === "string" && line.length > 0));

const ageDays = (readOn, today) =>
  Math.floor((today.getTime() - Date.parse(`${readOn}T00:00:00Z`)) / DAY_MS);

const quoteViolations = (entry, id) => {
  if (entry.quote === null)
    return entry.readOn > QUOTES_REQUIRED_AFTER
      ? [{ kind: "price-unquoted", id, readOn: entry.readOn }]
      : [];
  const stated = quotedNumbers(entry.quote);
  const missing = entry.periods
    .flatMap(periodNumbers)
    .filter((n) => ![...stated].some((s) => Math.abs(s - n) < 1e-9));
  return [...new Set(missing)].map((value) => ({
    kind: "price-not-in-quote",
    id,
    value,
  }));
};

export const entryViolations = (entry, today) => {
  const id = entry.ids?.[0];
  const priced = Array.isArray(entry.periods) && entry.periods.length > 0;
  if (priced === (typeof entry.unpriced === "string") || !isQuote(entry.quote))
    return [{ kind: "price-malformed", id }];
  const age = ageDays(entry.readOn, today);
  if (Number.isNaN(age)) return [{ kind: "price-malformed", id }];
  if (age < 0) return [{ kind: "price-future", id, readOn: entry.readOn }];
  if (age > MAX_AGE_DAYS)
    return [{ kind: "price-stale", id, readOn: entry.readOn }];
  return priced ? quoteViolations(entry, id) : [];
};
