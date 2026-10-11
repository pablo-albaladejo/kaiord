/**
 * Value Extraction Helpers
 *
 * Functions to extract values from Target objects. With a pace base, a
 * stored m/s reads back as the m:ss pace it was typed as.
 */

import { formatClock } from "../../../lib/units/clock";
import {
  mpsToPaceSeconds,
  type PaceInputBase,
} from "../../../lib/units/pace-input";
import type { Target } from "../../../types/krd";

const show = (
  value: Target | null,
  n: number | undefined,
  paceBase?: PaceInputBase
): string => {
  if (!n) return "";
  if (value?.type === "pace" && paceBase)
    return formatClock(mpsToPaceSeconds(n, paceBase));
  return String(n);
};

export const getCurrentUnit = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  return value.value.unit;
};

export const getValueString = (
  value: Target | null,
  paceBase?: PaceInputBase
): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit === "range") return "";
  const unit = value.value.unit;
  if (value.type === "pace" && unit !== "mps") return String(value.value.value);
  return show(value, value.value.value, paceBase);
};

export const getRangeMinString = (
  value: Target | null,
  paceBase?: PaceInputBase
): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit !== "range") return "";
  return show(value, value.value.min, paceBase);
};

export const getRangeMaxString = (
  value: Target | null,
  paceBase?: PaceInputBase
): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit !== "range") return "";
  return show(value, value.value.max, paceBase);
};
