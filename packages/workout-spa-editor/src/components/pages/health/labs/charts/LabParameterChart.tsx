/**
 * LabParameterChart — a parameter's evolution over several analyses (DoD-2):
 * canonical points across real dates, a reference region, and out-of-range
 * points marked from `flag`. Data attributes expose the point/outlier counts
 * and the reference kind (`band` two-sided, `threshold` one-sided, or `none`)
 * so the E2E can assert the reference + outliers.
 */
import type { LabValue } from "@kaiord/core";
import { useMemo } from "react";

import { useActiveLocale } from "../../../../../i18n/LocaleProvider";
import { useTranslate } from "../../../../../i18n/use-translate";
import type { ChartMetricDef } from "../../../../charts/uplot-base/uplot-base";
import { UplotChart } from "../../../../charts/uplot-base/uplot-chart";
import { labParameterLabel } from "../lab-parameter-label";
import { buildLabChartData, countOutliers } from "./build-lab-chart-data";
import { buildLabChartOptions } from "./build-lab-chart-options";
import { resolveReferenceBand } from "./reference-band";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 300;

export const LabParameterChart = ({
  parameterKey,
  values,
}: {
  parameterKey: string;
  values: LabValue[];
}) => {
  const locale = useActiveLocale();
  const t = useTranslate("labs-ui");
  const def: ChartMetricDef = useMemo(
    () => ({
      key: parameterKey,
      label: labParameterLabel(parameterKey, locale),
      unit: values[0]?.unitCanonical ?? "",
    }),
    [parameterKey, values, locale]
  );
  const band = useMemo(() => resolveReferenceBand(values), [values]);
  const data = useMemo(() => buildLabChartData(values, band), [values, band]);
  const options = useMemo(() => buildLabChartOptions(def, band), [def, band]);

  if (values.length === 0)
    return <p className="text-sm text-gray-600">{t("chart.empty")}</p>;

  return (
    <div
      data-testid="lab-parameter-chart"
      data-parameter-key={parameterKey}
      data-has-band={band ? "true" : "false"}
      data-band-kind={band?.kind ?? "none"}
      data-point-count={data[0]?.length ?? 0}
      data-outlier-count={countOutliers(data)}
      className="rounded-lg border border-gray-200 p-4 dark:border-slate-800"
    >
      <UplotChart
        key={parameterKey}
        options={options}
        data={data}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
      />
    </div>
  );
};
