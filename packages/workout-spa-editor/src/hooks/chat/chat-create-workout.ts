/**
 * The chat's create-workout action: the description goes to the generation
 * Provider only as far as the athlete's health decision for it allows, then
 * the workout is generated and written to the profile.
 */
import type { Sport } from "@kaiord/core";

import { descriptionHealth } from "../../application/chat/description-health";
import { healthWithheldError } from "../../application/chat/health-withheld";
import type { CreateWorkoutInput } from "../../application/chat/tools/chat-tool-deps";
import type { HealthShare } from "../../application/data-flows/data-flows";
import { healthKindsOf } from "../../application/data-flows/data-flows";
import type { TraceRun } from "../../application/trace/trace-run";
import { buildWorkoutRecord } from "../../components/pages/CreateWorkout/build-workout-record";
import {
  generateWorkoutKrd,
  type GenerationDeps,
} from "../../lib/generate-workout";
import {
  type HealthQuestion,
  type HealthRequestOptions,
  healthSharingGate,
} from "../../lib/health-sharing-gate";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { KRD } from "../../types/krd";

export type ChatWorkoutRun = {
  persistence: PersistencePort;
  deps: GenerationDeps;
  profileId: string;
  /** The generation Provider, which may not be the chat's. */
  provider: LlmProviderConfig;
  modelId: string;
  title: string;
  /** The turn's Trace: what it sent so far says what the description holds. */
  trace?: TraceRun;
  askHealth?: (
    question: HealthQuestion,
    options: HealthRequestOptions
  ) => Promise<HealthShare>;
};

const sportOf = (krd: KRD, fallback?: string): string => {
  const structured = krd.extensions?.structured_workout as
    { sport?: string } | undefined;
  return structured?.sport ?? fallback ?? "running";
};

/** Without the turn's Trace nothing says what it read: count it all. */
const healthIn = (run: ChatWorkoutRun) =>
  run.trace
    ? descriptionHealth(run.trace.sentSoFar(), run.provider.type)
    : { kinds: healthKindsOf("assistantWorkout"), alreadyAt: false };

const clearDescription = async (run: ChatWorkoutRun): Promise<void> => {
  const { kinds, alreadyAt } = healthIn(run);
  if (kinds.length === 0 || alreadyAt) return;
  const to = run.provider.type;
  const ask = run.askHealth ?? healthSharingGate.request;
  const share = await ask(
    { flow: "assistantWorkout", providerType: to },
    { onWait: () => void run.trace?.checkpoint() }
  );
  if (share === "withhold") throw healthWithheldError(to);
  run.trace?.sent(to, ["workoutDescription"], kinds);
};

export const doCreateWorkout = async (
  run: ChatWorkoutRun,
  input: CreateWorkoutInput
): Promise<unknown> => {
  await clearDescription(run);
  const krd = await generateWorkoutKrd({
    deps: run.deps,
    text: input.description,
    provider: run.provider,
    modelId: run.modelId,
    profileId: run.profileId,
    sport: input.sport as Sport | undefined,
    trace: run.trace,
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
