/**
 * Dependency shapes for the chat tool registry.
 *
 * Read tools need only profile-scoped persistence and the current date.
 * Action tools receive their side-effecting operations as injected
 * functions — the UI/hook layer supplies these (closing over the Train2Go
 * sync, workout-generation, and manual-health use cases) so the
 * application layer never reaches into React or Dexie directly.
 */
import type { PersistencePort } from "../../../ports/persistence-port";
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

export type ChatActionOps = {
  syncCoaching: () => Promise<unknown>;
  createWorkout: (input: CreateWorkoutInput) => Promise<unknown>;
  logHealthMetric: (input: LogHealthMetricInput) => Promise<unknown>;
};

export type ChatToolDeps = ReadToolDeps & { actions: ChatActionOps };
