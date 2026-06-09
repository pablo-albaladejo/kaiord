/**
 * Pure helpers for `useCoachingAi`. Lives in a separate file so the
 * hook stays under the line caps. No React: this module composes a
 * `GenerateKrdPort` adapter from a concrete `LlmProviderConfig` and
 * runs the use case end-to-end behind a single async function.
 */
import type { Analytics } from "@kaiord/core";

import { PROMPT_VERSION } from "../../../application/ai-prompts";
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
  now: () => string
): GenerateKrdPort => {
  return async ({ text, sport }) => {
    const krd = await generateWorkoutKrd({
      text,
      provider,
      sport: isKnownSport(sport) ? sport : undefined,
    });
    return {
      krd,
      aiMeta: {
        provider: provider.type,
        model: provider.model,
        promptVersion: PROMPT_VERSION,
        processedAt: now(),
      },
    };
  };
};

export const pickProvider = (
  providers: LlmProviderConfig[] | undefined,
  selectedProviderId: string | null
): LlmProviderConfig | null => {
  return (
    providers?.find((p) => p.id === selectedProviderId) ??
    providers?.[0] ??
    null
  );
};

export type RunAiInput = {
  activityId: string;
  provider: LlmProviderConfig;
  abortSignal: AbortSignal;
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
      generateKrd: buildGenerateKrdPort(input.provider, () =>
        new Date().toISOString()
      ),
      newWorkoutId: () => crypto.randomUUID(),
      newMatchId: () => crypto.randomUUID(),
      clock: () => new Date().toISOString(),
    }
  );
