/**
 * Pure helper that performs one LLM generation: builds the prompt
 * payload, invokes `generateWorkoutKrd`, surfaces the result through
 * the runtime-store setters and the analytics callback. Returning
 * the function from a helper module keeps `useAiGeneration` within
 * the file/function size budgets.
 */

import type { Analytics, Sport } from "@kaiord/core";

import { generateWorkoutKrd } from "../../../lib/generate-workout";
import type { GenerationState } from "../../../store/ai-store-types";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { KRD } from "../../../types/krd";
import type { Profile } from "../../../types/profile";
import type { SportKey } from "../../../types/sport-zones";
import { formatZonesContext } from "./zones-formatter";

export type GenerateRunArgs = {
  text: string;
  sport: Sport | undefined;
  provider: LlmProviderConfig;
  profile: Profile | null;
  customPrompt: string | null;
  setGeneration: (state: GenerationState) => void;
  loadWorkout: (krd: KRD) => void;
  analytics: Analytics;
};

export const runAiGeneration = async ({
  text,
  sport,
  provider,
  profile,
  customPrompt,
  setGeneration,
  loadWorkout,
  analytics,
}: GenerateRunArgs): Promise<void> => {
  setGeneration({ status: "loading" });

  let krd;
  try {
    const sportKey = (sport || undefined) as SportKey | undefined;
    const zonesContext = profile
      ? formatZonesContext(profile, sportKey)
      : undefined;

    krd = await generateWorkoutKrd({
      text,
      provider,
      sport,
      customPrompt: customPrompt ? customPrompt : undefined,
      zonesContext,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    setGeneration({ status: "error", message });
    return;
  }

  loadWorkout(krd);
  setGeneration({ status: "success" });

  // Analytics is fire-and-forget. A throw here is a telemetry bug,
  // not a generation failure — never demote a successful workout to
  // an error state because the metric pipeline hiccupped.
  try {
    analytics.event("workout-generated", {
      provider: provider.id,
      sport: sport ?? "",
    });
  } catch {
    // swallow
  }
};
