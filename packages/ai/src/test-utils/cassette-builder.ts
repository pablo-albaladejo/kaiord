import { PARITY_WARNINGS } from "../evals/cassettes/cassette-schema";
import type { Cassette } from "../evals/cassettes/cassette-schema";
import type { ReplaySuite } from "../evals/cassettes/case-verdict";
import {
  fixtureHashOf,
  requestHashOf,
  toolsHashOf,
} from "../evals/cassettes/request-hashes";
import type { CallOptions } from "../evals/cassettes/request-hashes";
import { mockModelReturning } from "./mock-language-model";

/** A one-step workout every `*-simple` benchmark of its sport accepts. */
export const simpleWorkout = (sport: string, seconds = 1800) => ({
  sport,
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds },
      targetType: "open",
      target: { type: "open" },
      intensity: "active",
    },
  ],
});

const caseOf = (suite: ReplaySuite, caseId: string) => {
  const found = suite.cases.find((c) => c.id === caseId);
  if (!found) throw new Error(`no case ${caseId}`);
  return found;
};

/** The request the real runtime sends for `caseId`, captured by a mock. */
export const captureRequest = async (
  suite: ReplaySuite,
  caseId: string,
  output: unknown
): Promise<CallOptions> => {
  const model = mockModelReturning(output);
  await caseOf(suite, caseId).run(model);
  const call = model.doGenerateCalls[0];
  if (!call) throw new Error(`case ${caseId} made no model call`);
  return call;
};

/**
 * An IN-MEMORY cassette, fresh against the current request. Tests build
 * `recorder: "claude-cli"` cassettes this way and never write them to disk.
 */
export const buildCassette = async (
  suite: ReplaySuite,
  caseId: string,
  output: unknown
): Promise<{ cassette: Cassette; request: CallOptions }> => {
  const request = await captureRequest(suite, caseId, output);
  const cassette: Cassette = {
    schemaVersion: 1,
    id: `${caseId}-1`,
    caseId,
    recorder: "claude-cli",
    cliVersion: "2.1.302",
    provider: "anthropic",
    requestedModelId: suite.modelId,
    servedModelId: suite.modelId,
    recordedAt: "2026-10-22T00:00:00.000Z",
    prompt: { ...suite.prompt },
    toolsHash: toolsHashOf(request),
    fixtureHash: fixtureHashOf(caseOf(suite, caseId).fixture),
    requestHash: requestHashOf(request, suite.modelId),
    sampling: { temperature: null, maxOutputTokens: null },
    parityWarnings: [...PARITY_WARNINGS],
    response: {
      structuredOutput: output as Cassette["response"]["structuredOutput"],
      finishReason: "stop",
      usage: { inputTokens: 700, outputTokens: 200 },
    },
  };
  return { cassette, request };
};
