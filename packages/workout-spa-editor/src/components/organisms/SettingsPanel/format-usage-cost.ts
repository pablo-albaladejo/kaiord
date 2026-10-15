/**
 * An estimated AI cost as US dollars in the reader's locale ("$0.25",
 * "0,25 US$"). Up to four decimals, so a run costing a fraction of a cent
 * still shows instead of rounding to zero.
 */
export const formatUsageCost = (usd: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(usd);
