import { createTextToWorkout } from "@kaiord/ai";
import type { AiTelemetrySink } from "@kaiord/ai/observability";
import { createLanguageModel } from "@kaiord/ai/providers";
import type { KRD, Sport } from "@kaiord/core";
import { createWorkoutKRD } from "@kaiord/core";

import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { createDexieUsageTelemetrySink } from "../adapters/telemetry/dexie-usage-telemetry-sink";
import type { LlmProviderConfig } from "../store/ai-store-types";

export type GenerateWorkoutOptions = {
  text: string;
  provider: LlmProviderConfig;
  modelId: string;
  sport?: Sport;
  customPrompt?: string;
  zonesContext?: string;
  // Telemetry sink override; defaults to the Dexie usage sink over the app db so
  // every generation call site is accounted without bolting on its own writer.
  telemetry?: AiTelemetrySink;
};

export const generateWorkoutKrd = async (
  options: GenerateWorkoutOptions
): Promise<KRD> => {
  const model = await createLanguageModel(options.provider, options.modelId, {
    browser: true,
  });
  const telemetry =
    options.telemetry ??
    createDexieUsageTelemetrySink(createDexiePersistence());
  const textToWorkout = createTextToWorkout({ model, telemetry });

  const prompt = buildPrompt(options);
  const workout = await textToWorkout(prompt, {
    sport: options.sport,
  });

  return createWorkoutKRD(workout);
};

const MAX_CUSTOM_PROMPT = 500;

const buildPrompt = (options: GenerateWorkoutOptions): string => {
  const parts = [options.text];

  if (options.zonesContext) {
    parts.push(`\nTraining zones:\n${options.zonesContext}`);
  }
  if (options.customPrompt) {
    const truncated = options.customPrompt.slice(0, MAX_CUSTOM_PROMPT);
    parts.push(`\nAdditional instructions:\n${truncated}`);
  }

  return parts.join("");
};
