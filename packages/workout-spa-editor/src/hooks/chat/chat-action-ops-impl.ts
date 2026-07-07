/**
 * Implementations for the chat action ops, as plain functions so the
 * `useChatActionOps` hook stays thin and these are unit-testable. Each wraps
 * an existing use case; none touches React.
 */
import type { Sport } from "@kaiord/core";

import type {
  CreateWorkoutInput,
  LogHealthMetricInput,
} from "../../application/chat/tools/chat-tool-deps";
import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { syncWeek } from "../../application/coaching/sync-week";
import { saveManualHealthMetric } from "../../application/health/save-manual-health-metric.use-case";
import { buildWorkoutRecord } from "../../components/pages/CreateWorkout/build-workout-record";
import { generateWorkoutKrd } from "../../lib/generate-workout";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { KRD } from "../../types/krd";
import { todayIsoDate } from "../../utils/today-iso-date";
import { getCurrentWeekId, parseWeekId } from "../../utils/week-utils";

const sportOf = (krd: KRD, fallback?: string): string => {
  const structured = krd.extensions?.structured_workout as
    { sport?: string } | undefined;
  return structured?.sport ?? fallback ?? "running";
};

export const doSyncCoaching = (
  persistence: PersistencePort,
  transport: CoachingTransport,
  profileId: string
): Promise<unknown> => {
  const weekStart = parseWeekId(getCurrentWeekId())?.start ?? todayIsoDate();
  return syncWeek(
    {
      profiles: persistence.profiles,
      coaching: persistence.coaching,
      transport,
      coachingSyncState: persistence.coachingSyncState,
      integrationPolicy: persistence.integrationPolicy,
    },
    profileId,
    weekStart
  );
};

export const doCreateWorkout = async (
  persistence: PersistencePort,
  profileId: string,
  provider: LlmProviderConfig,
  modelId: string,
  input: CreateWorkoutInput
): Promise<unknown> => {
  const krd = await generateWorkoutKrd({
    text: input.description,
    provider,
    modelId,
    sport: input.sport as Sport | undefined,
  });
  const record = await buildWorkoutRecord({
    profileId,
    sport: sportOf(krd, input.sport),
    prompt: input.description,
    title: "Chat workout",
    krd,
    date: input.date,
  });
  await persistence.workouts.put(record);
  return { workoutId: record.id, date: record.date };
};

export const doLogHealthMetric = async (
  persistence: PersistencePort,
  profileId: string,
  input: LogHealthMetricInput
): Promise<unknown> => {
  const result = await saveManualHealthMetric(
    { persistence, profileId },
    { metric: input.metric, day: input.day, value: input.value }
  );
  return result ?? { error: "invalid_value" };
};
