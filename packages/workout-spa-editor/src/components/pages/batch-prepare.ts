/**
 * Stage a batch AI run: resolve the `workout_generation` model for the
 * active profile and gather every RAW workout in the given week. Returns a
 * tagged result so the caller can surface a user-friendly message when
 * either piece is missing.
 */

import { resolveModelForPurpose } from "@kaiord/ai/providers";

import { createDexieAiModelBindingRepository } from "../../adapters/dexie/dexie-ai-model-binding-repository";
import { createDexieAiProviderRepository } from "../../adapters/dexie/dexie-ai-provider-repository";
import { db } from "../../adapters/dexie/dexie-database";
import { createDexieProfileRepository } from "../../adapters/dexie/dexie-profile-repository";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";

export type BatchPrep =
  | {
      ok: true;
      provider: LlmProviderConfig;
      modelId: string;
      workouts: WorkoutRecord[];
    }
  | { ok: false; message: string };

export async function prepareBatch(
  weekStart: string,
  weekEnd: string
): Promise<BatchPrep> {
  const providers = await createDexieAiProviderRepository(db).getAll();
  const profileId = await createDexieProfileRepository(db).getActiveId();
  const bindings = profileId
    ? await createDexieAiModelBindingRepository(db).getAll(profileId)
    : [];
  const resolved = resolveModelForPurpose(
    "workout_generation",
    providers,
    bindings
  );
  if (!resolved) {
    return { ok: false, message: "Configure an AI provider in Settings." };
  }

  const workouts = await db
    .table<WorkoutRecord>("workouts")
    .where("date")
    .between(weekStart, weekEnd, true, true)
    .filter((w) => w.state === "raw")
    .toArray();

  if (workouts.length === 0) {
    return { ok: false, message: "No raw workouts to process this week." };
  }

  return {
    ok: true,
    provider: resolved.provider,
    modelId: resolved.modelId,
    workouts,
  };
}
