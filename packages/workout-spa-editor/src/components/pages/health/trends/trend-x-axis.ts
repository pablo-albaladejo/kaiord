import type { Locale } from "@kaiord/i18n";
import type uPlot from "uplot";

import type { HealthDateRange } from "../../../../hooks/health/health-live-query";
import { themedAxis } from "../../../charts/uplot-base/chart-theme";
import {
  EMPTY,
  isoDateToSeconds,
  timeXScale,
} from "../../../charts/uplot-base/uplot-base";

/** The window the user asked for, and the name of the date series. */
export type TrendWindow = { range: HealthDateRange; label: string };

const MS_PER_SECOND = 1000;
const TICK: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
};
const LEGEND: Intl.DateTimeFormatOptions = { ...TICK, year: "numeric" };

// x values are UTC midnights (isoDateToSeconds), so they are formatted in UTC
// to name the same calendar day in every time zone.
const dateFormatter = (locale: Locale, options: Intl.DateTimeFormatOptions) => {
  const format = new Intl.DateTimeFormat(locale, options);
  return (seconds: number) => format.format(seconds * MS_PER_SECOND);
};

// Without a fixed range uPlot fits the data: one point spreads to years.
export const trendXScale = (window?: TrendWindow): uPlot.Scales =>
  window
    ? {
        x: {
          time: true,
          range: [
            isoDateToSeconds(window.range.start),
            isoDateToSeconds(window.range.end),
          ],
        },
      }
    : timeXScale();

export const trendXAxis = (locale: Locale): uPlot.Axis => {
  const format = dateFormatter(locale, TICK);
  return themedAxis({ values: (_u, splits) => splits.map(format) });
};

export const trendXSeries = (
  locale: Locale,
  window?: TrendWindow
): uPlot.Series => {
  if (!window) return {};
  const format = dateFormatter(locale, LEGEND);
  return {
    label: window.label,
    value: (_u, v) => (v == null ? EMPTY : format(v)),
  };
};
