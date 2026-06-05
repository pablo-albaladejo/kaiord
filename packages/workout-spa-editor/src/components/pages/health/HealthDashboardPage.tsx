/**
 * /health — Wellness trends hub.
 *
 * Renders a single uPlot canvas with one X axis (time, bottom) and one
 * Y axis per selected metric (right side, packed horizontally outward)
 * in each metric's native unit. All series share a uniform stroke; line
 * discrimination is by axis + legend label. No drag-to-reorder; no
 * multi-instance sync.
 */
import { useMemo } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { lastNDays } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";
import { HealthSubRouteLinks } from "./HealthSubRouteLinks";
import { TrendMetricSelector } from "./trends/TrendMetricSelector";
import { TrendRangeSelector } from "./trends/TrendRangeSelector";
import { TrendSingleChartCard } from "./trends/TrendSingleChartCard";
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
      <TrendSingleChartCard
        selected={selected}
        series={series}
        rangeDays={rangeDays}
      />
      <div className="mt-4">
        <HealthSubRouteLinks />
      </div>
    </section>
  );
}
