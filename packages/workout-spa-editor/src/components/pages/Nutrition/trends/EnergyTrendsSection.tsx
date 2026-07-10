import { lazy, Suspense, useMemo, useState } from "react";

import { useEnergyRollup } from "../../../../hooks/energy/use-energy-rollup";
import { useTranslate } from "../../../../i18n/use-translate";
import { Card } from "../../../atoms/Card";
import { Icon, ICON_MAP } from "../../../atoms/Icon";
import {
  type EnergyTrendRangeDays,
  resolveTrendRange,
} from "./energy-trend-range";
import { EnergyRollupSummary } from "./EnergyRollupSummary";
import { EnergyTrendRangeSelector } from "./EnergyTrendRangeSelector";
import { useEnergyTrendSeries } from "./use-energy-trend-series";

// Lazy so uPlot (which touches window.matchMedia at module init) only loads
// when a chart actually renders — keeps the Nutrition page importable in tests
// and trims the route's initial bundle.
const EnergyTrendChartCard = lazy(() => import("./EnergyTrendChartCard"));

export type EnergyTrendsSectionProps = { profileId: string; date: string };

/**
 * Trends view: the weight EMA trend + goal line with steps / sleep / weekly
 * training overlaid, plus the range roll-up. Reads live from Dexie.
 */
export function EnergyTrendsSection({
  profileId,
  date,
}: EnergyTrendsSectionProps) {
  const t = useTranslate("nutrition");
  const [days, setDays] = useState<EnergyTrendRangeDays>(30);
  const range = useMemo(() => resolveTrendRange(date, days), [date, days]);
  const { series, loading } = useEnergyTrendSeries(profileId, range);
  const rollup = useEnergyRollup(profileId, range.start, range.end);
  const hasWeight = series.weightRaw.length > 0;

  return (
    <Card
      className="border-edge bg-surface p-4"
      data-testid="energy-trends"
    >
      <div className="flex items-center gap-3">
        <Icon icon={ICON_MAP.trend} size="md" color="inherit" />
        <p className="m-0 text-[15px] font-semibold text-ink-strong">
          {t("trends.title")}
        </p>
        <div className="ml-auto">
          <EnergyTrendRangeSelector selected={days} onSelect={setDays} />
        </div>
      </div>
      {rollup ? (
        <div className="mt-3">
          <EnergyRollupSummary rollup={rollup} />
        </div>
      ) : null}
      <div className="mt-3">
        {loading ? (
          <p
            className="text-[13px] text-ink-muted"
            data-testid="energy-trends-loading"
          >
            {t("trends.loading")}
          </p>
        ) : hasWeight ? (
          <Suspense fallback={null}>
            <EnergyTrendChartCard series={series} />
          </Suspense>
        ) : (
          <p
            className="text-[13px] text-ink-muted"
            data-testid="energy-trends-empty"
          >
            {t("trends.empty")}
          </p>
        )}
      </div>
    </Card>
  );
}
