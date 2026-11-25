/**
 * The notes-only call: the step notes of a Workout whose steps are already
 * built from a coach's steps table. It sends the coach's text and one line
 * per step (its duration and the coach's zone label), never the athlete's
 * zones nor any other health data, so it asks nothing first. It leaves its
 * own Trace.
 */
import {
  buildStepNotesText,
  createStepNotesAgent,
  runGenerateAgent,
  type StepNote,
  type StepNotesInput,
} from "@kaiord/ai/agents";
import { createLanguageModel } from "@kaiord/ai/providers";

import { DATA_FLOWS } from "../application/data-flows/data-flows";
import { startTraceRun } from "../application/trace/trace-run";
import type { LlmProviderConfig } from "../store/ai-store-types";
import type { GenerationDeps } from "./generate-workout-options";

export type GenerateStepNotesOptions = {
  deps: GenerationDeps;
  input: StepNotesInput;
  provider: LlmProviderConfig;
  modelId: string;
  abortSignal?: AbortSignal;
};

export const generateStepNotes = async (
  options: GenerateStepNotesOptions
): Promise<StepNote[]> => {
  const { persistence, usage } = options.deps;
  const trace = startTraceRun({
    feature: "generation",
    traces: persistence.traces,
  });
  try {
    const model = await createLanguageModel(options.provider, options.modelId, {
      browser: true,
    });
    trace.sent(options.provider.type, DATA_FLOWS.coachingStepNotes.kinds);
    const { output } = await runGenerateAgent(
      createStepNotesAgent(options.input.steps.length),
      { text: buildStepNotesText(options.input) },
      { model, telemetry: trace.sink(usage), signal: options.abortSignal }
    );
    await trace.finish();
    return output;
  } catch (error) {
    await trace.finish(options.abortSignal?.aborted ? "stopped" : "failed");
    throw error;
  }
};
