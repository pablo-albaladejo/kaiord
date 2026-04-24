import type { Sport } from "@kaiord/core";
import { useCallback } from "react";

import { useAnalytics } from "../../../contexts";
import { generateWorkoutKrd } from "../../../lib/generate-workout";
import { useAiStore } from "../../../store/ai-store";
import { useProfileStore } from "../../../store/profile-store";
import { useLoadWorkout } from "../../../store/workout-store-selectors";
import type { SportKey } from "../../../types/sport-zones";
import { formatZonesContext } from "./zones-formatter";

export const useAiGeneration = () => {
  const { getSelectedProvider, customPrompt, setGeneration } = useAiStore();
  const { getActiveProfile } = useProfileStore();
  const loadWorkout = useLoadWorkout();
  const analytics = useAnalytics();

  const generate = useCallback(
    async (text: string, sport?: Sport) => {
      const provider = getSelectedProvider();
      if (!provider) return;

      setGeneration({ status: "loading" });

      try {
        const profile = getActiveProfile();
        const sportKey = (sport || undefined) as SportKey | undefined;
        const zonesContext = profile
          ? formatZonesContext(profile, sportKey)
          : undefined;

        const krd = await generateWorkoutKrd({
          text,
          provider,
          sport,
          customPrompt: customPrompt || undefined,
          zonesContext,
        });

        loadWorkout(krd);
        setGeneration({ status: "success" });
        analytics.event("workout-generated", {
          provider: provider.id,
          sport: sport ?? "",
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Generation failed";
        setGeneration({ status: "error", message });
      }
    },
    [
      getSelectedProvider,
      customPrompt,
      setGeneration,
      getActiveProfile,
      loadWorkout,
      analytics,
    ]
  );

  return { generate };
};
