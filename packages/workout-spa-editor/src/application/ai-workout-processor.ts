/**
 * AI Workout Processor
 *
 * Orchestrates single workout AI processing: build prompt,
 * call LLM, validate output, retry on failure.
 */

import type { AiMeta } from "../types/calendar-fragments";
import type { WorkoutRecord } from "../types/calendar-record";
import type { KRD } from "../types/schemas";
import { buildUserPrompt, PROMPT_VERSION } from "./ai-prompts";
import { validateSanity } from "./sanity-checks";

export type GenerateFn = (prompt: string, sport: string) => Promise<KRD>;

export type ProcessResult =
  | { ok: true; krd: KRD; aiMeta: AiMeta; retried: boolean }
  | { ok: false; error: string; retried: boolean };

export type ProcessorParams = {
  workout: WorkoutRecord;
  selectedComments: string[];
  zonesContext: string;
  generateFn: GenerateFn;
  provider: string;
  model: string;
  allowRetry?: boolean;
};

export async function processWorkoutWithAi(
  params: ProcessorParams
): Promise<ProcessResult> {
  const { workout, generateFn, allowRetry = true } = params;

  if (!workout.raw) {
    return { ok: false, error: "Workout has no raw data", retried: false };
  }

  const prompt = buildUserPrompt(
    workout.sport,
    workout.raw.description,
    params.selectedComments
  );

  const first = await attemptGeneration(prompt, workout.sport, generateFn);
  if (first.ok) return toSuccess(first.krd, params, false);

  if (!allowRetry) {
    return { ok: false, error: first.error, retried: false };
  }

  const retryPrompt = appendRetryContext(prompt, first.error);
  const retry = await attemptGeneration(retryPrompt, workout.sport, generateFn);
  if (retry.ok) return toSuccess(retry.krd, params, true);

  return { ok: false, error: retry.error, retried: true };
}

type AttemptResult = { ok: true; krd: KRD } | { ok: false; error: string };

async function attemptGeneration(
  prompt: string,
  sport: string,
  generateFn: GenerateFn
): Promise<AttemptResult> {
  try {
    const krd = await generateFn(prompt, sport);
    const sanityError = validateSanity(krd);
    if (sanityError) return { ok: false, error: sanityError };
    return { ok: true, krd };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

function toSuccess(
  krd: KRD,
  params: ProcessorParams,
  retried: boolean
): ProcessResult {
  return {
    ok: true,
    krd,
    aiMeta: {
      promptVersion: PROMPT_VERSION,
      model: params.model,
      provider: params.provider,
      processedAt: new Date().toISOString(),
    },
    retried,
  };
}

function appendRetryContext(prompt: string, error: string): string {
  return `${prompt}\n\n<previous_error>\n${error}\n</previous_error>\nPlease fix the above error and try again.`;
}
