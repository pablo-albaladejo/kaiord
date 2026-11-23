import type { OnGenerateProgress } from "@kaiord/ai";
import { createTextToWorkout } from "@kaiord/ai";
import { createLanguageModel } from "@kaiord/ai/providers";
import type { KRD, Sport } from "@kaiord/core";
import { createWorkoutKRD } from "@kaiord/core";

import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { createDexieUsageTelemetrySink } from "../adapters/telemetry/dexie-usage-telemetry-sink";
import { kindsSent } from "../application/data-flows/kinds-sent";
import { startTraceRun, type TraceRun } from "../application/trace/trace-run";
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
  // The run this generation belongs to (a batch, a chat turn). Omitted, the
  // generation is a run of its own and leaves its own Trace, so no call site
  // can forget it. Its usage lands in the usage events either way.
  trace?: TraceRun;
  // Aborts the provider request itself, not just the caller's wait.
  abortSignal?: AbortSignal;
  // When set, the output streams and real progress is reported per phase.
  onProgress?: OnGenerateProgress;
  // Asks whether heart-rate data may go, called only when it would; a batch
  // passes one that asks once for all its generations. Omitted, the gate asks.
  askHealth?: () => Promise<HealthShare>;
};

const generate = async (
  options: GenerateWorkoutOptions,
  trace: TraceRun
): Promise<KRD> => {
  const persistence = createDexiePersistence();
  const athlete =
    options.athlete ?? (await loadAthleteInput(persistence, options.profileId));
  const ask =
    options.askHealth ?? (() => askGenerationHealth(options.provider.type));
  let healthSent = false;
  const context = await generationContext(athlete, options.sport, async () => {
    const share = await ask();
    healthSent = share === "send";
    return share;
  });
  const model = await createLanguageModel(options.provider, options.modelId, {
    browser: true,
  });
  const telemetry = trace.sink(createDexieUsageTelemetrySink(persistence));
  const textToWorkout = createTextToWorkout({ model, telemetry });
  trace.sent(options.provider.type, kindsSent("generation", healthSent));

  const workout = await textToWorkout(options.text, {
    sport: options.sport,
    athlete: context,
    signal: options.abortSignal,
    onProgress: options.onProgress,
  });

  return createWorkoutKRD(workout);
};

export const generateWorkoutKrd = async (
  options: GenerateWorkoutOptions
): Promise<KRD> => {
  if (options.trace) return generate(options, options.trace);
  const trace = startTraceRun({
    feature: "generation",
    traces: createDexiePersistence().traces,
  });
  try {
    const krd = await generate(options, trace);
    await trace.finish();
    return krd;
  } catch (error) {
    await trace.finish(options.abortSignal?.aborted ? "stopped" : "failed");
    throw error;
  }
};
