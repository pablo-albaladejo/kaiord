/**
 * Format a stored value's effective reference range (canonical unit) for the
 * report review (DoD-3). Prefers numeric canonical bounds, falls back to the
 * report's raw `refText`, else the em-dash placeholder.
 */
import type { LabValue } from "@kaiord/core";

import { EMPTY } from "../../../charts/uplot-base/uplot-base";

export type RefRangeFields = Pick<
  LabValue,
  "refLowCanonical" | "refHighCanonical" | "refText"
>;

export const formatRefRange = (value: RefRangeFields): string => {
  const { refLowCanonical: low, refHighCanonical: high, refText } = value;
  if (low != null && high != null) return `${low}–${high}`;
  if (low != null) return `≥ ${low}`;
  if (high != null) return `≤ ${high}`;
  if (refText != null && refText.trim() !== "") return refText.trim();
  return EMPTY;
};

const ORIGIN_LABELS = {
  report: "from report",
  catalog: "catalog fallback",
  none: "no range",
} as const;

/** Human label for where the effective range came from (DoD-3). */
export const refSourceLabel = (source: LabValue["refSource"]): string =>
  ORIGIN_LABELS[source];
