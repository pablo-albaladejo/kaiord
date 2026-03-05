import { useCallback } from "react";
import { formatZonesContext } from "./zones-formatter";
import { generateWorkoutKrd } from "../../../lib/generate-workout";
import { useAiStore } from "../../../store/ai-store";
import { useProfileStore } from "../../../store/profile-store";
import { useWorkoutStore } from "../../../store/workout-store";
import type { Sport } from "@kaiord/core";

export const useAiGeneration = () => {
  const { getSelectedProvider, customPrompt, setGeneration } = useAiStore();
  const { getActiveProfile } = useProfileStore();
  const { loadWorkout } = useWorkoutStore();

  const generate = useCallback(
    async (text: string, sport?: Sport) => {
      const provider = getSelectedProvider();
      if (!provider) return;

      setGeneration({ status: "loading" });

      try {
        const profile = getActiveProfile();
        const zonesContext = profile ? formatZonesContext(profile) : undefined;

        const krd = await generateWorkoutKrd({
          text,
          provider,
          sport,
          customPrompt: customPrompt || undefined,
          zonesContext,
        });

        loadWorkout(krd);
        setGeneration({ status: "success" });
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
    ]
  );

  return { generate };
};
