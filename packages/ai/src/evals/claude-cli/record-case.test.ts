import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTextToWorkout } from "../../adapters/text-to-workout";
import { cliRun } from "../../test-utils/claude-cli-doubles";
import { mockModelReturning } from "../../test-utils/mock-language-model";
import { simpleWorkout } from "../../test-utils/cassette-builder";
import type { ReplayCase } from "../cassettes/case-verdict";
import { createParserReplaySuite } from "../cassettes/parser-replay-suite";
import { createReplayModel } from "../cassettes/replay-model";
import { validateCassette } from "../cassettes/validate-cassette";
import { createClaudeCliLanguageModel } from "./claude-cli-language-model";
import { isHarnessFault } from "./harness-fault";
import { recordCase } from "./record-case";

/** One call plus the runtime's two validation retries. */
const PRODUCTION_ATTEMPTS = 3;

const NOW = () => new Date("2026-10-22T10:00:00.000Z");
const suite = createParserReplaySuite("claude-sonnet-5");
const caseOf = (id: string) =>
  suite.cases.find((c) => c.id === id) as ReplayCase;

const cliModel = (
  output: unknown,
  modelUsage: Record<string, Record<string, number>> = {
    "claude-sonnet-5": { inputTokens: 600 },
  }
) => {
  let calls = 0;
  const model = createClaudeCliLanguageModel({
    modelId: "claude-sonnet-5",
    call: async () => {
      calls++;
      return cliRun({ structuredOutput: output, modelUsage });
    },
  });
  return { model, calls: () => calls };
};

const faultOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "resolved",
    (error) => (isHarnessFault(error) ? error.message : `other: ${error}`)
  );

describe("recordCase", () => {
  beforeEach(() => vi.stubGlobal("AI_SDK_LOG_WARNINGS", false));
  afterEach(() => vi.unstubAllGlobals());

  it("should record one call as a valid cassette that replays fresh", async () => {
    // Arrange
    const { model } = cliModel(simpleWorkout("cycling"));
    const onStale = vi.fn();

    // Act
    const recorded = await recordCase(
      suite,
      caseOf("cycling-simple"),
      model,
      NOW
    );
    const replayed = await caseOf("cycling-simple").run(
      createReplayModel(recorded.cassette, suite.modelId, onStale)
    );

    // Assert
    expect(validateCassette(recorded.cassette).ok).toBe(true);
    expect(recorded.cassette).toMatchObject({
      id: "cycling-simple",
      recordedAt: "2026-10-22T10:00:00.000Z",
      recorder: "claude-cli",
      cliVersion: "2.1.308",
      requestedModelId: "claude-sonnet-5",
      servedModelId: "claude-sonnet-5",
      sampling: { temperature: null, maxOutputTokens: null },
      response: { usage: { inputTokens: 670, outputTokens: 20 } },
    });
    expect(onStale).not.toHaveBeenCalled();
    expect(replayed.some((o) => o.status === "passed")).toBe(true);
  });

  it("should still record an answer the runtime rejects, as a real decision", async () => {
    // Arrange
    const { model, calls } = cliModel({ sport: "cycling", steps: "none" });

    // Act
    const recorded = await recordCase(
      suite,
      caseOf("cycling-simple"),
      model,
      NOW
    );

    // Assert
    expect(calls()).toBe(1);
    expect("error" in recorded.outcome).toBe(true);
    expect(recorded.cassette.response.structuredOutput).toEqual({
      sport: "cycling",
      steps: "none",
    });
  });

  it("should reject a case that made more than one call", async () => {
    // Arrange
    const { model, calls } = cliModel({ sport: "cycling", steps: "none" });
    const retrying: ReplayCase = {
      id: "cycling-simple",
      fixture: {},
      // Production retries: the runtime's default of two.
      run: async (m) => {
        await createTextToWorkout({ model: m })("30 min easy ride");
        return [];
      },
    };

    // Act
    const fault = await faultOf(recordCase(suite, retrying, model, NOW));

    // Assert
    expect(calls()).toBe(PRODUCTION_ATTEMPTS);
    expect(fault).toContain(
      "made 3 model calls; a cassette records exactly one"
    );
  });

  it("should reject a case that made no call", async () => {
    // Arrange
    const { model } = cliModel(simpleWorkout("cycling"));
    const silent: ReplayCase = { id: "x", fixture: {}, run: async () => [] };

    // Act
    const fault = await faultOf(recordCase(suite, silent, model, NOW));

    // Assert
    expect(fault).toContain("made 0 model calls");
  });

  it("should rethrow the case's own error when its only call rejects", async () => {
    // Arrange
    const model = createClaudeCliLanguageModel({
      modelId: "claude-sonnet-5",
      call: async () => {
        throw new TypeError("the pass stopped on a rate limit");
      },
    });

    // Act
    const caught = await recordCase(
      suite,
      caseOf("cycling-simple"),
      model,
      NOW
    ).catch((error: unknown) => error);

    // Assert
    expect(isHarnessFault(caught)).toBe(false);
    expect(caught).toMatchObject({
      name: "AiParsingError",
      lastError: "the pass stopped on a rate limit",
    });
  });

  it("should keep the original error's identity when no call completed", async () => {
    // Arrange
    const { model } = cliModel(simpleWorkout("cycling"));
    const cause = new RangeError("fixture out of range");
    const failing: ReplayCase = {
      id: "x",
      fixture: {},
      run: async () => {
        throw cause;
      },
    };

    // Act
    const caught = await recordCase(suite, failing, model, NOW).catch(
      (error: unknown) => error
    );

    // Assert
    expect(caught).toBe(cause);
    expect(caught).toBeInstanceOf(RangeError);
  });

  it("should reject a result naming more than one served model", async () => {
    // Arrange
    const { model } = cliModel(simpleWorkout("cycling"), {
      "claude-sonnet-5": { inputTokens: 600 },
      "claude-haiku-4-5": { inputTokens: 40 },
    });

    // Act
    const fault = await faultOf(
      recordCase(suite, caseOf("cycling-simple"), model, NOW)
    );

    // Assert
    expect(fault).toContain("modelUsage names 2 served models");
  });

  it("should reject a substituted model and accept a dated snapshot", async () => {
    // Arrange
    const substituted = cliModel(simpleWorkout("cycling"), {
      "claude-haiku-4-5": { inputTokens: 600 },
    });
    const dated = cliModel(simpleWorkout("cycling"), {
      "claude-sonnet-5-20261001": { inputTokens: 600 },
    });

    // Act
    const fault = await faultOf(
      recordCase(suite, caseOf("cycling-simple"), substituted.model, NOW)
    );
    const recorded = await recordCase(
      suite,
      caseOf("cycling-simple"),
      dated.model,
      NOW
    );

    // Assert
    expect(fault).toContain("served claude-haiku-4-5, which is neither");
    expect(recorded.cassette.servedModelId).toBe("claude-sonnet-5-20261001");
  });

  it("should reject a call without CLI provenance or without an answer", async () => {
    // Arrange
    const noProvenance = mockModelReturning(simpleWorkout("cycling"));
    const noAnswer = cliModel(undefined);

    // Act
    const faults = [
      await faultOf(
        recordCase(suite, caseOf("cycling-simple"), noProvenance, NOW)
      ),
      await faultOf(
        recordCase(suite, caseOf("cycling-simple"), noAnswer.model, NOW)
      ),
    ];

    // Assert
    expect(faults).toEqual([
      "the call carries no CLI provenance",
      "the call returned no text",
    ]);
  });
});
