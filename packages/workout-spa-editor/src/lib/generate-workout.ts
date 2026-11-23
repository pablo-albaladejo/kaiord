import type { OnGenerateProgress } from "@kaiord/ai";
import { createTextToWorkout } from "@kaiord/ai";
import {
  type AiTelemetrySink,
  createConsoleTelemetrySink,
} from "@kaiord/ai/observability";
import { createLanguageModel } from "@kaiord/ai/providers";
import type { KRD, Sport } from "@kaiord/core";
import { createWorkoutKRD } from "@kaiord/core";

import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { createDexieUsageTelemetrySink } from "../adapters/telemetry/dexie-usage-telemetry-sink";
import type { LlmProviderConfig } from "../store/ai-store-types";
import type { AthleteInput } from "./athlete-generation-context";
import { loadAthleteInput } from "./athlete-generation-context";
import { generationContext } from "./athlete-health-context";
import { askGenerationHealth, type HealthShare } from "./health-sharing-gate";

export type GenerateWorkoutOptions = {
  text: string;
  provider: LlmProviderConfig;
  modelId: string;
  sport?: Sport;
  // The athlete's profile (zones) and custom AI instructions. Omitted, they
  // are read from the app db, so no generation call site can forget them.
  athlete?: AthleteInput;
  // The profile the workout is generated for, when it is not the active one
  // (batch and chat write the workout to a given profile).
  profileId?: string;
  // Telemetry sink override; defaults to the Dexie usage sink over the app db so
  // every generation call site is accounted without bolting on its own writer,
  // plus a console.debug line per run with its phase timings (ids and metrics
  // only), so where a slow run spent its time can be read in DevTools.
  telemetry?: AiTelemetrySink;
  // Aborts the provider request itself, not just the caller's wait.
  abortSignal?: AbortSignal;
  // When set, the output streams and real progress is reported per phase.
  onProgress?: OnGenerateProgress;
  // Asks whether heart-rate data may go, called only when it would; a batch
  // passes one that asks once for all its generations. Omitted, the gate asks.
  askHealth?: () => Promise<HealthShare>;
};

const defaultTelemetry = (usage: AiTelemetrySink): AiTelemetrySink => {
  const debugLine = createConsoleTelemetrySink();
  return {
    emit: (event) => {
      usage.emit(event);
      debugLine.emit(event);
    },
  };
};

export const generateWorkoutKrd = async (
  options: GenerateWorkoutOptions
): Promise<KRD> => {
  const persistence = createDexiePersistence();
  const athlete =
    options.athlete ?? (await loadAthleteInput(persistence, options.profileId));
  const context = await generationContext(
    athlete,
    options.sport,
    options.askHealth ?? (() => askGenerationHealth(options.provider.type))
  );
  const model = await createLanguageModel(options.provider, options.modelId, {
    browser: true,
  });
  const telemetry =
    options.telemetry ??
    defaultTelemetry(createDexieUsageTelemetrySink(persistence));
  const textToWorkout = createTextToWorkout({ model, telemetry });

  const workout = await textToWorkout(options.text, {
    sport: options.sport,
    athlete: context,
    signal: options.abortSignal,
    onProgress: options.onProgress,
  });

  return createWorkoutKRD(workout);
};
