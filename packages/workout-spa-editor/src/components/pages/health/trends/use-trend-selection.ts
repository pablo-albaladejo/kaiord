import { useCallback, useState } from "react";

import type { TrendMetricKey, TrendRangeDays } from "./trend-metrics";

const DEFAULT_METRICS: TrendMetricKey[] = ["sleep", "hrv"];
const DEFAULT_RANGE: TrendRangeDays = 90;

export const useTrendSelection = () => {
  const [selected, setSelected] = useState<Set<TrendMetricKey>>(
    () => new Set(DEFAULT_METRICS)
  );
  const [rangeDays, setRangeDays] = useState<TrendRangeDays>(DEFAULT_RANGE);

  const toggle = useCallback((key: TrendMetricKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return { selected, toggle, rangeDays, setRangeDays };
};
