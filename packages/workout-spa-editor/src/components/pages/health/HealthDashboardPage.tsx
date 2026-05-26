/**
 * /health — Wellness trends hub.
 *
 * Cross-metric view: the user picks one or more metrics and a date
 * range; each selected metric renders as a line chart (uPlot) over
 * that range, with a per-metric empty state when no data exists.
 */
import { useMemo } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { lastNDays } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";
import { TrendMetricSelector } from "./trends/TrendMetricSelector";
import { TrendOverlayCard } from "./trends/TrendOverlayCard";
import { TrendRangeSelector } from "./trends/TrendRangeSelector";
import { useTrendSelection } from "./trends/use-trend-selection";
import { useTrendSeries } from "./trends/use-trend-series";

export default function HealthDashboardPage() {
  const active = useActiveProfileLive();
  const profileLabel = active?.profile?.name ?? "Active profile";
  const { selected, toggle, rangeDays, setRangeDays } = useTrendSelection();
  const range = useMemo(() => lastNDays(rangeDays), [rangeDays]);
  const series = useTrendSeries(active?.id ?? "", range);
  return (
    <section data-testid="health-dashboard">
      <HealthPageHeader title="Trends" subtitle={profileLabel} />
      <div className="mb-4 flex flex-col gap-3">
        <TrendMetricSelector selected={selected} onToggle={toggle} />
        <TrendRangeSelector selected={rangeDays} onSelect={setRangeDays} />
      </div>
      <TrendOverlayCard
        selected={selected}
        series={series}
        rangeDays={rangeDays}
      />
    </section>
  );
}
