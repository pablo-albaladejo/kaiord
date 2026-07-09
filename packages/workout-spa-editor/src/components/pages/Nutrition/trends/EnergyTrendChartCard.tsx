import { useMemo } from "react";

import { useTranslate } from "../../../../i18n/use-translate";
import { UplotChart } from "../../health/trends/UplotChart";
import { buildEnergyTrendOptions } from "./build-energy-trend-options";
import {
  buildEnergyTrendData,
  ENERGY_TREND_KEYS,
  type EnergyTrendKey,
  type EnergyTrendSeries,
} from "./energy-trend-series";

const CHART_WIDTH = 880;
const CHART_HEIGHT = 320;

export type EnergyTrendChartCardProps = {
  series: EnergyTrendSeries;
};

const presentKeys = (series: EnergyTrendSeries): EnergyTrendKey[] =>
  ENERGY_TREND_KEYS.filter((key) => series[key].length > 0);

/** Renders the aligned multi-series Nutrition trends chart via uPlot. */
export function EnergyTrendChartCard({ series }: EnergyTrendChartCardProps) {
  const t = useTranslate("nutrition");
  const keys = useMemo(() => presentKeys(series), [series]);
  const options = useMemo(() => buildEnergyTrendOptions(keys, t), [keys, t]);
  const data = useMemo(
    () => buildEnergyTrendData(keys, series),
    [keys, series]
  );

  return (
    <div
      data-testid="energy-trend-chart"
      className="rounded-lg border border-slate-800 p-3"
    >
      <UplotChart
        key={keys.join("-")}
        options={options}
        data={data}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
      />
    </div>
  );
}

export default EnergyTrendChartCard;
