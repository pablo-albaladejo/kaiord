/**
 * Pure helpers for `useCoachingAi`. Lives in a separate file so the
 * hook stays under the line caps. No React: this module composes a
 * `GenerateKrdPort` adapter from a concrete `LlmProviderConfig` and
 * runs the use case end-to-end behind a single async function.
 */
import type { OnGenerateProgress } from "@kaiord/ai";
import { PROMPT_VERSION } from "@kaiord/ai/prompts";
import type { Analytics } from "@kaiord/core";

import type { GenerateKrdPort } from "../../../application/coaching/convert-coaching-activity-with-ai";
import { convertCoachingActivityWithAi } from "../../../application/coaching/convert-coaching-activity-with-ai";
import { generateWorkoutKrd } from "../../../lib/generate-workout";
import type { PersistencePort } from "../../../ports/persistence-port";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { Sport } from "../../../types/schemas";
import { sportSchema } from "../../../types/schemas";

const isKnownSport = (s: string): s is Sport =>
  sportSchema.safeParse(s).success;

export const buildGenerateKrdPort = (
  provider: LlmProviderConfig,
  modelId: string,
  now: () => string,
  onProgress?: OnGenerateProgress
): GenerateKrdPort => {
  return async ({ text, sport, abortSignal }) => {
    const krd = await generateWorkoutKrd({
      text,
      provider,
      modelId,
      sport: isKnownSport(sport) ? sport : undefined,
      abortSignal,
      onProgress,
    });
    return {
      krd,
      aiMeta: {
        provider: provider.type,
        model: modelId,
        promptVersion: PROMPT_VERSION,
        processedAt: now(),
      },
    };
  };
};

export type RunAiInput = {
  activityId: string;
  provider: LlmProviderConfig;
  modelId: string;
  abortSignal: AbortSignal;
  onProgress?: OnGenerateProgress;
  persistence: PersistencePort;
  analytics: Analytics;
};

export const runConvertWithAi = (input: RunAiInput) =>
  convertCoachingActivityWithAi(
    { activityId: input.activityId, abortSignal: input.abortSignal },
    {
      coaching: input.persistence.coaching,
      workouts: input.persistence.workouts,
      sessionMatches: input.persistence.sessionMatch,
      analytics: input.analytics,
      generateKrd: buildGenerateKrdPort(
        input.provider,
        input.modelId,
        () => new Date().toISOString(),
        input.onProgress
      ),
      newWorkoutId: () => crypto.randomUUID(),
      newMatchId: () => crypto.randomUUID(),
      clock: () => new Date().toISOString(),
    }
  );
