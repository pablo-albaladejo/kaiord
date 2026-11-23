/**
 * Every flow by which the Kaiord App sends data off the device: where it
 * goes and which kinds of data it carries. The inventory in Settings renders
 * this list, the first-time notice reads a health flow's kinds from it, and
 * `data-flows-coverage.test.ts` fails on a flow the code has and this list
 * does not. Each id is worded under `flows.<id>` in the `dataFlows`
 * dictionary. `withheld` marks a health flow to a Provider: what it does
 * when the athlete says no (goes without its health data, or does not go).
 */
import { LLM_PROVIDER_TYPES } from "@kaiord/ai/providers";

import { type DataKind, type HealthDataKind, isHealthKind } from "./data-kinds";
import { type DestinationId, DESTINATIONS } from "./destinations";

const PROVIDERS = LLM_PROVIDER_TYPES;
const READ_PLATFORMS = [
  "garmin",
  "trainingpeaks",
  "train2go",
  "tanita",
  "whoop",
] as const;

export type DataFlow = {
  to: readonly DestinationId[];
  kinds: readonly DataKind[];
  withheld?: "goesWithout" | "doesNotGo";
};

export const DATA_FLOWS = {
  assistant: {
    to: PROVIDERS,
    kinds: [
      "messages",
      "workouts",
      "coachingPlan",
      "dataSources",
      "sleep",
      "restingHeartRate",
      "weight",
      "hrv",
      "dailyActivity",
      "bodyComposition",
      "stress",
      "meals",
      "energyBalance",
    ],
    withheld: "goesWithout",
  },
  generation: {
    to: PROVIDERS,
    kinds: [
      "workoutDescription",
      "aiInstructions",
      "powerPaceZones",
      "heartRateZones",
    ],
    withheld: "goesWithout",
  },
  labImport: { to: PROVIDERS, kinds: ["labResults"], withheld: "doesNotGo" },
  providerKeyCheck: { to: PROVIDERS, kinds: ["providerKey"] },
  garminWorkouts: { to: ["garmin"], kinds: ["workouts"] },
  garminBody: { to: ["garmin"], kinds: ["weight", "bodyComposition"] },
  trainingpeaksWorkouts: { to: ["trainingpeaks"], kinds: ["workouts"] },
  platformReads: { to: READ_PLATFORMS, kinds: ["readRequests"] },
  intervalsKeyCheck: { to: ["intervals"], kinds: ["intervalsKey"] },
  driveSync: { to: ["drive"], kinds: ["syncSnapshot"] },
  analytics: { to: ["umami"], kinds: ["pageViews", "productEvents"] },
} as const satisfies Record<string, DataFlow>;

export type DataFlowId = keyof typeof DATA_FLOWS;

export const DATA_FLOW_IDS = Object.keys(DATA_FLOWS) as DataFlowId[];

/** The flows that carry health data to a Provider: the notice's paths. */
export type HealthFlowId = {
  [Id in DataFlowId]: (typeof DATA_FLOWS)[Id] extends { withheld: string }
    ? Id
    : never;
}[DataFlowId];

/** Whether one request may carry the athlete's health data. */
export type HealthShare = "send" | "withhold";

export const healthKindsOf = (flow: DataFlowId): HealthDataKind[] =>
  (DATA_FLOWS[flow].kinds as readonly DataKind[]).filter(isHealthKind);

/** Every health kind any flow can send to a Provider, in registry order. */
export const providerHealthKinds = (): HealthDataKind[] => [
  ...new Set(
    DATA_FLOW_IDS.filter((id) =>
      DATA_FLOWS[id].to.some((to) => DESTINATIONS[to].group === "provider")
    ).flatMap(healthKindsOf)
  ),
];

export const flowsTo = (destination: DestinationId): DataFlowId[] =>
  DATA_FLOW_IDS.filter((id) =>
    (DATA_FLOWS[id].to as readonly DestinationId[]).includes(destination)
  );
