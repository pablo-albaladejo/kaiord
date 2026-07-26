import type { ManagedDataRegistryEntry } from "./managed-data-type";
import {
  heartRateSeriesSchema,
  strainSummarySchema,
  vitalsSummarySchema,
} from "./schemas/health";

/**
 * Registry entries for the read-only wearable-session metrics — `strain`,
 * `vitals`, `heart-rate-series` — split out of `managed-data-type-registry.ts`
 * to stay under the 100-line file cap. All three share the `read:body`
 * capability token; no new token is invented (design D3b).
 */
export const WEARABLE_SESSION_REGISTRY_ENTRIES: Record<
  "strain" | "vitals" | "heart-rate-series",
  ManagedDataRegistryEntry
> = {
  strain: {
    label: "Strain",
    schema: strainSummarySchema,
    capabilities: { import: "read:body" },
  },
  vitals: {
    label: "Vitals",
    schema: vitalsSummarySchema,
    capabilities: { import: "read:body" },
  },
  "heart-rate-series": {
    label: "Heart Rate Series",
    schema: heartRateSeriesSchema,
    capabilities: { import: "read:body" },
  },
};
