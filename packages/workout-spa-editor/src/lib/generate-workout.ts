import { createTextToWorkout } from "@kaiord/ai";
import { createWorkoutKRD } from "@kaiord/core";
import { createLanguageModel } from "./provider-factory";
import type { LlmProviderConfig } from "../store/ai-store";
import type { KRD, Sport } from "@kaiord/core";

export type GenerateWorkoutOptions = {
  text: string;
  provider: LlmProviderConfig;
  sport?: Sport;
  customPrompt?: string;
  zonesContext?: string;
};

export const generateWorkoutKrd = async (
  options: GenerateWorkoutOptions
): Promise<KRD> => {
  const model = createLanguageModel(options.provider);
  const textToWorkout = createTextToWorkout({ model });

  const prompt = buildPrompt(options);
  const workout = await textToWorkout(prompt, {
    sport: options.sport,
  });

  return createWorkoutKRD(workout);
};

const buildPrompt = (options: GenerateWorkoutOptions): string => {
  const parts = [options.text];

  if (options.zonesContext) {
    parts.push(`\nTraining zones:\n${options.zonesContext}`);
  }
  if (options.customPrompt) {
    parts.push(`\nAdditional instructions:\n${options.customPrompt}`);
  }

  return parts.join("");
};
