/**
 * Maps ManagedDataType values to the Dexie store name that holds
 * records of that type. Adapter concern — lives here, not in application/.
 */
import type { ManagedDataType } from "@kaiord/core";

export const HEALTH_STORE_FOR_TYPE: Partial<Record<ManagedDataType, string>> = {
  weight: "healthWeight",
  sleep: "healthSleep",
  hrv: "healthHrv",
  "daily-wellness": "healthDaily",
  "body-composition": "healthBodyComposition",
  stress: "healthStress",
  strain: "healthStrain",
  vitals: "healthVitals",
  "heart-rate-series": "healthHeartRateSeries",
};
