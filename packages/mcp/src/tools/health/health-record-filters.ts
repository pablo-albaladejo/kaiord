import type { KRD } from "@kaiord/core";

export type HealthKrdType =
  "sleep_record" | "weight_measurement" | "hrv_summary" | "daily_wellness";

type DateExtractor = (health: Record<string, unknown>) => string | undefined;

const DATE_EXTRACTORS: Record<HealthKrdType, DateExtractor> = {
  sleep_record: (h) =>
    (h.sleep as { startTime?: string } | undefined)?.startTime,
  weight_measurement: (h) =>
    (h.weight as { measuredAt?: string } | undefined)?.measuredAt,
  hrv_summary: (h) =>
    (h.hrv as { measuredAt?: string } | undefined)?.measuredAt,
  daily_wellness: (h) => (h.daily as { date?: string } | undefined)?.date,
};

const dateFor = (krd: KRD): string | undefined => {
  const health = krd.extensions?.health as Record<string, unknown> | undefined;
  if (!health) return undefined;
  const extractor = DATE_EXTRACTORS[krd.type as HealthKrdType];
  return extractor ? extractor(health) : undefined;
};

export const pickHealthByType = (krds: KRD[], type: HealthKrdType): KRD[] =>
  krds.filter((krd) => krd.type === type);

export const sortByHealthDate = (krds: KRD[]): KRD[] =>
  [...krds].sort((a, b) => {
    const dateA = dateFor(a) ?? "";
    const dateB = dateFor(b) ?? "";
    if (dateA === dateB) return 0;
    return dateA < dateB ? -1 : 1;
  });

export const latestOf = (krds: KRD[]): KRD | undefined => {
  const sorted = sortByHealthDate(krds);
  return sorted.length === 0 ? undefined : sorted[sorted.length - 1];
};
