/**
 * Stage a batch AI run: pick the default provider and gather every
 * RAW workout in the given week. Returns a tagged result so the
 * caller can surface a user-friendly message when either piece is
 * missing.
 */

import { createDexieAiProviderRepository } from "../../adapters/dexie/dexie-ai-provider-repository";
import { db } from "../../adapters/dexie/dexie-database";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";

export type BatchPrep =
  | { ok: true; provider: LlmProviderConfig; workouts: WorkoutRecord[] }
  | { ok: false; message: string };

export async function prepareBatch(
  weekStart: string,
  weekEnd: string
): Promise<BatchPrep> {
  const repo = createDexieAiProviderRepository(db);
  const providers = await repo.getAll();
  const provider = providers.find((p) => p.isDefault) ?? providers[0];
  if (!provider) {
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

  return { ok: true, provider, workouts };
}
