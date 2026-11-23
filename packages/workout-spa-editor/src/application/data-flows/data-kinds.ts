/**
 * Every kind of data the Kaiord App can send off the device. Each id is
 * worded once, English and Spanish, under `kinds.<id>` in the `dataFlows`
 * dictionary; the health kinds are the ones the first-time notice names.
 */
const HEALTH_DATA_KINDS = [
  "sleep",
  "restingHeartRate",
  "weight",
  "hrv",
  "dailyActivity",
  "bodyComposition",
  "stress",
  "meals",
  "energyBalance",
  "heartRateZones",
  "labResults",
] as const;

export const OTHER_DATA_KINDS = [
  "messages",
  "workouts",
  "coachingPlan",
  "dataSources",
  "workoutDescription",
  "aiInstructions",
  "powerPaceZones",
  "providerKey",
  "intervalsKey",
  "readRequests",
  "syncSnapshot",
  "pageViews",
  "productEvents",
] as const;

export const DATA_KINDS = [...HEALTH_DATA_KINDS, ...OTHER_DATA_KINDS] as const;

export type HealthDataKind = (typeof HEALTH_DATA_KINDS)[number];
export type DataKind = HealthDataKind | (typeof OTHER_DATA_KINDS)[number];

const HEALTH: ReadonlySet<string> = new Set(HEALTH_DATA_KINDS);

export const isHealthKind = (kind: DataKind): kind is HealthDataKind =>
  HEALTH.has(kind);
