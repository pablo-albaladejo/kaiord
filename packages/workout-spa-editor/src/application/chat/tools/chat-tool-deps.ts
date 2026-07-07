/**
 * Dependency shapes for the chat tool registry.
 *
 * Read tools need only profile-scoped persistence and the current date.
 * Action tools receive their side-effecting operations as injected
 * functions — the UI/hook layer supplies these (closing over the Train2Go
 * sync, workout-generation, and manual-health use cases) so the
 * application layer never reaches into React or Dexie directly.
 */
import type { ManagedDataType, MealSlot } from "@kaiord/core";

import type { PersistencePort } from "../../../ports/persistence-port";
import type { DataTypeSourceMode } from "../../../types/data-type-source-policy";
import type { IntegrationPolicyDirection } from "../../../types/integration-policy";
import type { DataHubMatrixSignals } from "../../data-hub/build-data-hub-matrix";
import type { ManualHealthMetric } from "../../health/manual-health-metric";

export type ReadToolDeps = {
  persistence: PersistencePort;
  profileId: string;
  /** Current date as YYYY-MM-DD; injected so tools never read the clock. */
  today: string;
};

export type CreateWorkoutInput = {
  description: string;
  date: string;
  sport?: string;
};

export type LogHealthMetricInput = {
  metric: ManualHealthMetric;
  day: string;
  value: number;
};

export type LogIntakeInput = {
  date: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  label?: string;
  mealSlot?: MealSlot;
};

export type PushToGarminInput = {
  workoutId: string;
};

/**
 * `set_data_route` input (F6). `integrationId` is the chat-facing
 * INTEGRATION_REGISTRY id (e.g. "whoop", "train2go"), resolved to the
 * IntegrationPolicy/DataTypeSourcePolicy storage key (the bridge id) by
 * the op implementation — see hooks/chat/do-set-data-route.ts. A
 * `set_source_policy` sourceOrder of a single integration id means "read
 * only from that source" (the resolver's reconciliation invariant already
 * ignores sources outside the order).
 */
export type SetDataRouteInput =
  | {
      action: "enable_route" | "disable_route";
      dataType: ManagedDataType;
      integrationId: string;
      direction: IntegrationPolicyDirection;
    }
  | {
      action: "set_source_policy";
      dataType: ManagedDataType;
      mode: DataTypeSourceMode;
      sourceOrder?: string[];
    };

export type ChatActionOps = {
  syncCoaching: () => Promise<unknown>;
  createWorkout: (input: CreateWorkoutInput) => Promise<unknown>;
  logHealthMetric: (input: LogHealthMetricInput) => Promise<unknown>;
  logIntake: (input: LogIntakeInput) => Promise<unknown>;
  pushToGarmin: (input: PushToGarminInput) => Promise<unknown>;
  setDataRoute: (input: SetDataRouteInput) => Promise<unknown>;
};

export type ChatToolDeps = ReadToolDeps & {
  actions: ChatActionOps;
  /** One-shot snapshot provider for the get_data_routes read tool. */
  getMatrixSignals: () => Promise<DataHubMatrixSignals>;
};
