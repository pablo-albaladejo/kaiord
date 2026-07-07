/**
 * Derive the F3.1 per-parameter list from one `getValuesByProfile` read:
 * the latest value per parameter (DoD-4 — reuses the use case's tie-break so
 * a parameter measured only in an old report still surfaces) plus that
 * parameter's full canonical series as sparkline points.
 */
import type { LabValue } from "@kaiord/core";

import { latestByParameter } from "../../../../application/lab/lab-queries";
import type { SparklinePoint } from "../../../charts/uplot-base/build-sparkline";
import { isoDateToSeconds } from "../../../charts/uplot-base/uplot-base";

export type LabParameterSummary = {
  parameterKey: string;
  latest: LabValue;
  points: SparklinePoint[];
};

export const buildLabParameterSummaries = (
  values: readonly LabValue[]
): LabParameterSummary[] => {
  const seriesByKey = new Map<string, SparklinePoint[]>();
  for (const v of values) {
    const points = seriesByKey.get(v.parameterKey) ?? [];
    points.push({ x: isoDateToSeconds(v.date), y: v.valueCanonical });
    seriesByKey.set(v.parameterKey, points);
  }
  return latestByParameter(values).map((latest) => ({
    parameterKey: latest.parameterKey,
    latest,
    points: [...(seriesByKey.get(latest.parameterKey) ?? [])].sort(
      (a, b) => a.x - b.x
    ),
  }));
};
