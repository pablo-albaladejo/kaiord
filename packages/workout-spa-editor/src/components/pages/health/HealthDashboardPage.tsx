/**
 * /health — Wellness trends hub.
 *
 * Renders a single uPlot canvas with one X axis (time, bottom) and one
 * Y axis per selected metric (right side, packed horizontally outward)
 * in each metric's native unit. Series are told apart by lightness, dash and
 * label — never by hue, which belongs to training zones. No drag-to-reorder;
 * no multi-instance sync.
 */
import { useMemo } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { lastNDays } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";
import { TrendMetricSelector } from "./trends/TrendMetricSelector";
import { TrendRangeSelector } from "./trends/TrendRangeSelector";
import { TrendSingleChartCard } from "./trends/TrendSingleChartCard";
import { useTrendSelection } from "./trends/use-trend-selection";
import { useTrendSeries } from "./trends/use-trend-series";

export default function HealthDashboardPage() {
  const t = useTranslate("health");
  const active = useActiveProfileLive();
  const profileLabel = active?.profile?.name ?? t("dashboard.activeProfile");
  const { selected, toggle, rangeDays, setRangeDays } = useTrendSelection();
  const range = useMemo(() => lastNDays(rangeDays), [rangeDays]);
  const series = useTrendSeries(active?.id ?? "", range);
  return (
    <section data-testid="health-dashboard">
      <HealthPageHeader title={t("dashboard.title")} subtitle={profileLabel} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TrendMetricSelector selected={selected} onToggle={toggle} />
        <div className="ml-auto">
          <TrendRangeSelector selected={rangeDays} onSelect={setRangeDays} />
        </div>
      </div>
      <TrendSingleChartCard
        selected={selected}
        series={series}
        rangeDays={rangeDays}
      />
    </section>
  );
}
