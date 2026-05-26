// R-PIIInterpolation: returned string is for JSX rendering only; do not pass
// to toast()/console.* without re-evaluating the static-source rule
// (scripts/check-no-pii-leakage.mjs walks components/hooks/lib).

import type { TrendMetricDef, TrendMetricKey } from "./trend-metrics";

const PLACEHOLDER_TEMPLATES: Record<TrendMetricKey, (days: number) => string> =
  {
    sleep: (n) =>
      `No Sleep data in the last ${n} days. Import a FIT or add manually.`,
    hrv: (n) =>
      `No HRV data in the last ${n} days. Import a FIT or add manually.`,
    weight: (n) =>
      `No Weight data in the last ${n} days. Import a FIT or add manually.`,
    steps: (n) =>
      `No Steps data in the last ${n} days. Import a FIT or add manually.`,
  };

export type EmptyPanePlaceholderProps = {
  metric: TrendMetricDef;
  rangeDays: number;
};

export const EmptyPanePlaceholder = ({
  metric,
  rangeDays,
}: EmptyPanePlaceholderProps) => {
  const text = PLACEHOLDER_TEMPLATES[metric.key](rangeDays);
  return (
    <p
      data-testid={`trend-empty-${metric.key}`}
      className="flex min-h-[160px] items-center justify-center text-center text-sm text-gray-600"
    >
      {text}
    </p>
  );
};
