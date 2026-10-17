/** The chat's create-workout action: generate, then write to the profile. */
import type { Sport } from "@kaiord/core";

import type { CreateWorkoutInput } from "../../application/chat/tools/chat-tool-deps";
import { buildWorkoutRecord } from "../../components/pages/CreateWorkout/build-workout-record";
import { generateWorkoutKrd } from "../../lib/generate-workout";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { KRD } from "../../types/krd";

const sportOf = (krd: KRD, fallback?: string): string => {
  const structured = krd.extensions?.structured_workout as
    { sport?: string } | undefined;
  return structured?.sport ?? fallback ?? "running";
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
    profileId,
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
