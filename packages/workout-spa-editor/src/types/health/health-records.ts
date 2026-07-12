/**
 * Per-metric health record aliases.
 *
 * Each metric persists as a `HealthRecord<TPayload>` where the payload
 * is the KRD v2.0 Zod type from `@kaiord/core`. The Dexie row PK is
 * the nanoid `id`; the per-profile date-range query is backed by the
 * `[profileId+date]` compound index declared in `dexie-schemas.ts`.
 */
import type {
  BodyComposition,
  DailyWellness,
  HrvSummary,
  SleepRecord,
  StrainSummary,
  StressEpisode,
  VitalsSummary,
  WeightMeasurement,
} from "@kaiord/core";

import type { HealthRecord } from "../../ports/health-record-repository";

export type HealthSleepRecord = HealthRecord<SleepRecord>;
export type HealthWeightRecord = HealthRecord<WeightMeasurement>;
export type HealthHrvRecord = HealthRecord<HrvSummary>;
export type HealthDailyRecord = HealthRecord<DailyWellness>;
export type HealthBodyCompositionRecord = HealthRecord<BodyComposition>;
export type HealthStressRecord = HealthRecord<StressEpisode>;
export type HealthStrainRecord = HealthRecord<StrainSummary>;
export type HealthVitalsRecord = HealthRecord<VitalsSummary>;
