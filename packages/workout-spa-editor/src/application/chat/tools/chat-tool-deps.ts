/**
 * Dependency shapes for the chat tool registry.
 *
 * Read tools need only profile-scoped persistence and the current date.
 * Action tools receive their side-effecting operations as injected
 * functions — the UI/hook layer supplies these (closing over the Train2Go
 * sync, workout-generation, and manual-health use cases) so the
 * application layer never reaches into React or Dexie directly.
 */
import type { MealSlot } from "@kaiord/core";

import type { PersistencePort } from "../../../ports/persistence-port";
import type { DataHubMatrixSignals } from "../../data-hub/build-data-hub-matrix";
import type { ManualHealthMetric } from "../../health/manual-health-metric";
import type {
  SetAuthorityInput,
  SetDataRouteInput,
} from "./source-tool-inputs";

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

export type ChatActionOps = {
  syncCoaching: () => Promise<unknown>;
  createWorkout: (input: CreateWorkoutInput) => Promise<unknown>;
  logHealthMetric: (input: LogHealthMetricInput) => Promise<unknown>;
  logIntake: (input: LogIntakeInput) => Promise<unknown>;
  pushToGarmin: (input: PushToGarminInput) => Promise<unknown>;
  setDataRoute: (input: SetDataRouteInput) => Promise<unknown>;
  setAuthority: (input: SetAuthorityInput) => Promise<unknown>;
};

export type ChatToolDeps = ReadToolDeps & {
  actions: ChatActionOps;
  /** The athlete lets this Provider read their health data; absent, it may not. */
  healthShared?: boolean;
  /** One-shot snapshot provider for the get_data_routes read tool. */
  getMatrixSignals: () => Promise<DataHubMatrixSignals>;
  /** False for a Tool an off Capability owns: it is not offered at all. */
  offersTool: (toolName: string) => boolean;
};
