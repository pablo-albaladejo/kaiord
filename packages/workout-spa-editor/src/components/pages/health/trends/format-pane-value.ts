// R-PIIInterpolation: returned string is for JSX rendering only; do not pass
// to toast()/console.* without re-evaluating the static-source rule
// (scripts/check-no-pii-leakage.mjs walks components/hooks/lib).

import type { Locale } from "@kaiord/i18n";

import type { Units } from "../../../../lib/units/units";
import { formatWeightKg } from "../../../../lib/units/units";
import { formatOrEmpty } from "../../../charts/uplot-base/uplot-base";
import type { TrendMetricDef, TrendMetricKey } from "./trend-metrics";

// Module-cached formatters (2 locales) — `Intl.NumberFormat` construction is
// costly and this runs per axis tick / legend value during chart render.
const EN_NUMBER = new Intl.NumberFormat("en");
const ES_NUMBER = new Intl.NumberFormat("es");
const numberFormatter = (locale: Locale): Intl.NumberFormat =>
  locale === "es" ? ES_NUMBER : EN_NUMBER;

// No `default`: an exhaustive switch keeps a new `TrendMetricKey` a compile
// error (via noImplicitReturns) until it is given an explicit formatter.
const formatMetricValue = (
  key: TrendMetricKey,
  v: number,
  locale: Locale
): string => {
  switch (key) {
    case "hrv":
      return `${Math.round(v)} ms`;
    case "weight":
      return `${v.toFixed(1)} kg`;
    case "steps":
      return `${numberFormatter(locale).format(Math.round(v))} steps`;
    case "sleep":
      return `${Math.round(v)}`;
  }
};

export const formatPaneValue = (
  metric: TrendMetricDef,
  v: number | null | undefined,
  units: Units = "metric",
  locale: Locale = "en"
): string =>
  formatOrEmpty(v, (n) =>
    // Weight values are stored in kilograms; relabel in the active units.
    metric.key === "weight"
      ? formatWeightKg(n, units)
      : formatMetricValue(metric.key, n, locale)
  );
