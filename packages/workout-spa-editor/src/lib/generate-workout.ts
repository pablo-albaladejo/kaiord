import { createTextToWorkout } from "@kaiord/ai";
import { createLanguageModel } from "@kaiord/ai/providers";
import type { KRD } from "@kaiord/core";
import { createWorkoutKRD } from "@kaiord/core";

import { startTraceRun, type TraceRun } from "../application/trace/trace-run";
import { loadAthleteInput } from "./athlete-generation-context";
import { generationContext } from "./athlete-health-context";
import type { GenerateWorkoutOptions } from "./generate-workout-options";
import { askGenerationHealth } from "./health-sharing-gate";

export type {
  GenerateWorkoutOptions,
  GenerationDeps,
} from "./generate-workout-options";

const generate = async (
  options: GenerateWorkoutOptions,
  trace: TraceRun
): Promise<KRD> => {
  const { persistence, usage } = options.deps;
  const athlete =
    options.athlete ?? (await loadAthleteInput(persistence, options.profileId));
  const ask =
    options.askHealth ??
    (() =>
      askGenerationHealth(options.provider.type, {
        signal: options.abortSignal,
        onWait: () => void trace.checkpoint(),
      }));
  const { context, kinds } = await generationContext(
    athlete,
    options.sport,
    ask
  );
  const model = await createLanguageModel(options.provider, options.modelId, {
    browser: true,
  });
  const textToWorkout = createTextToWorkout({
    model,
    telemetry: trace.sink(usage),
  });
  trace.sent(options.provider.type, kinds);

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
    traces: options.deps.persistence.traces,
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
