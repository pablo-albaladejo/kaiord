import { z } from "zod";

import { parseRefTextBounds } from "./ref-text";

/** Out-of-range flag for a measured value, always evaluated in canonical unit. */
export const labFlagSchema = z.enum(["in", "low", "high", "unknown"]);
export type LabFlag = z.infer<typeof labFlagSchema>;

export type BiologicalSex = "male" | "female";

type Bounds = { low?: number; high?: number };

/** Canonical catalog fallback range for a parameter, optionally sex-aware. */
export type CatalogFallback = Bounds & {
  bySex?: { male: Bounds; female: Bounds };
};

export type ComputeFlagInput = {
  valueCanonical: number;
  refLowCanonical?: number;
  refHighCanonical?: number;
  refText?: string;
  catalogFallback?: CatalogFallback;
  sex?: BiologicalSex;
};

/**
 * Classify a canonical value against the effective reference range.
 * Priority: report canonical bounds > report `refText` > catalog fallback
 * (sex-aware when `refBySex` and `sex` are present) > `"unknown"`. A `refText`
 * that does not parse to numeric bounds yields `"unknown"` (not highlighted).
 */
export function computeFlag(input: ComputeFlagInput): LabFlag {
  const bounds = resolveBounds(input);
  if (!bounds || (bounds.low == null && bounds.high == null)) return "unknown";
  return classify(input.valueCanonical, bounds);
}

function resolveBounds(input: ComputeFlagInput): Bounds | undefined {
  const { refLowCanonical, refHighCanonical, refText, catalogFallback } = input;
  if (refLowCanonical != null || refHighCanonical != null) {
    return { low: refLowCanonical, high: refHighCanonical };
  }
  if (refText != null && refText.trim() !== "") {
    return parseRefTextBounds(refText);
  }
  return resolveCatalogBounds(catalogFallback, input.sex);
}

function resolveCatalogBounds(
  fallback: CatalogFallback | undefined,
  sex: BiologicalSex | undefined
): Bounds | undefined {
  if (!fallback) return undefined;
  if (sex && fallback.bySex) return fallback.bySex[sex];
  return { low: fallback.low, high: fallback.high };
}

function classify(value: number, bounds: Bounds): LabFlag {
  if (bounds.low != null && value < bounds.low) return "low";
  if (bounds.high != null && value > bounds.high) return "high";
  return "in";
}
