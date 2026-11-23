/**
 * The chat's create-workout action: the description goes to the generation
 * Provider only as far as the athlete's health decision for it allows, then
 * the workout is generated and written to the profile.
 */
import type { Sport } from "@kaiord/core";

import type { CreateWorkoutInput } from "../../application/chat/tools/chat-tool-deps";
import { buildWorkoutRecord } from "../../components/pages/CreateWorkout/build-workout-record";
import { generateWorkoutKrd } from "../../lib/generate-workout";
import { abortError } from "../../lib/health-question-queue";
import type { KRD } from "../../types/krd";
import { type ChatWorkoutRun, clearDescription } from "./chat-workout-run";

export type { ChatWorkoutRun } from "./chat-workout-run";

const sportOf = (krd: KRD, fallback?: string): string => {
  const structured = krd.extensions?.structured_workout as
    { sport?: string } | undefined;
  return structured?.sport ?? fallback ?? "running";
};

export const doCreateWorkout = async (
  run: ChatWorkoutRun,
  input: CreateWorkoutInput
): Promise<unknown> => {
  await clearDescription(run);
  if (run.signal?.aborted) throw abortError();
  const krd = await generateWorkoutKrd({
    deps: run.deps,
    text: input.description,
    provider: run.provider,
    modelId: run.modelId,
    profileId: run.profileId,
    sport: input.sport as Sport | undefined,
    trace: run.trace,
    abortSignal: run.signal,
  });
  const record = await buildWorkoutRecord({
    profileId: run.profileId,
    sport: sportOf(krd, input.sport),
    prompt: input.description,
    title: run.title,
    krd,
    date: input.date,
  });
  await run.persistence.workouts.put(record);
  return { workoutId: record.id, date: record.date };
};
