import { z } from "zod";
import { PARITY_WARNINGS } from "../cassettes/cassette-schema";
import type { Cassette } from "../cassettes/cassette-schema";
import type { ReplayCase, ReplaySuite } from "../cassettes/case-verdict";
import {
  fixtureHashOf,
  requestHashOf,
  toolsHashOf,
} from "../cassettes/request-hashes";
import { validateCassette } from "../cassettes/validate-cassette";
import type { DimensionOutcome } from "../types";
import { harnessFault } from "./harness-fault";
import { CLI_METADATA_KEY } from "./language-model-types";
import type { LanguageModelV4 } from "./language-model-types";
import { createRecordingModel } from "./recording-model";
import type { RecordedCall } from "./recording-model";
import { servedModelOf } from "./served-model";

const provenanceSchema = z.object({
  cliVersion: z.string().min(1),
  servedModels: z.array(z.string()),
});

const FINISH = ["stop", "length", "content-filter", "other"] as const;

const answerOf = (call: RecordedCall): Cassette["response"] => {
  const text = call.result.content.find((part) => part.type === "text");
  if (text?.type !== "text") throw harnessFault("the call returned no text");
  const unified = call.result.finishReason.unified;
  const { inputTokens, outputTokens } = call.result.usage;
  return {
    structuredOutput: JSON.parse(text.text),
    finishReason: FINISH.find((f) => f === unified) ?? "other",
    usage: {
      inputTokens: inputTokens.total ?? 0,
      outputTokens: outputTokens.total ?? 0,
    },
  };
};

/** One recorded call as a cassette, validated; any doubt is a harness fault. */
export const cassetteOf = (
  suite: ReplaySuite,
  replayCase: ReplayCase,
  call: RecordedCall,
  recordedAt: Date
): Cassette => {
  const meta = provenanceSchema.safeParse(
    call.result.providerMetadata?.[CLI_METADATA_KEY]
  );
  if (!meta.success) throw harnessFault("the call carries no CLI provenance");
  const served = servedModelOf(meta.data.servedModels, suite.modelId);
  if (!served.ok) throw harnessFault(`recording rejected: ${served.reason}`);
  const validation = validateCassette({
    schemaVersion: 1,
    // One cassette per case: a re-record replaces it, file and manifest entry.
    id: replayCase.id,
    caseId: replayCase.id,
    recorder: "claude-cli",
    cliVersion: meta.data.cliVersion,
    provider: "anthropic",
    requestedModelId: suite.modelId,
    servedModelId: served.servedModelId,
    recordedAt: recordedAt.toISOString(),
    prompt: { ...suite.prompt },
    toolsHash: toolsHashOf(call.options),
    fixtureHash: fixtureHashOf(replayCase.fixture),
    requestHash: requestHashOf(call.options, suite.modelId),
    sampling: { temperature: null, maxOutputTokens: null },
    parityWarnings: [...PARITY_WARNINGS],
    response: answerOf(call),
  });
  if (!validation.ok) throw harnessFault(validation.errors.join("; "));
  return validation.cassette;
};

export type RecordedCase = {
  cassette: Cassette;
  outcome: { outcomes: Array<DimensionOutcome> } | { error: unknown };
};

/**
 * Runs a replay case (`maxRetries: 0`) once over the recording decorator. A
 * cassette is exactly one attempted call that completed (D4): any other
 * count, a retry that rejected included, is rejected. A scored
 * failure still records, because the stored answer is a real decision. A
 * case that failed before any call completed rethrows its own error.
 */
export const recordCase = async (
  suite: ReplaySuite,
  replayCase: ReplayCase,
  inner: LanguageModelV4,
  now: () => Date = () => new Date()
): Promise<RecordedCase> => {
  const recording = createRecordingModel(inner);
  let outcome: RecordedCase["outcome"];
  try {
    outcome = { outcomes: await replayCase.run(recording.model) };
  } catch (error) {
    outcome = { error };
  }
  const calls = recording.calls();
  const attempts = recording.attempts();
  // The only attempt rejected, or none was made: its own error is the cause.
  if (calls.length === 0 && attempts <= 1 && "error" in outcome) {
    throw outcome.error;
  }
  const [only] = calls;
  if (attempts !== 1 || calls.length !== 1 || only === undefined) {
    throw harnessFault(
      `case ${replayCase.id} made ${attempts} model calls (${calls.length} completed); a cassette records exactly one`
    );
  }
  return { cassette: cassetteOf(suite, replayCase, only, now()), outcome };
};
