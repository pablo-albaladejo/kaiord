import { UnsupportedFunctionalityError } from "ai";
import { describe, expect, it } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import { createClaudeCliLanguageModel } from "./claude-cli-language-model";
import { harnessFault } from "./harness-fault";
import type { V4CallOptions } from "./language-model-types";
import { runLivePass } from "./live-pass";
import type { LiveCase } from "./live-pass";
import { createLiveSession } from "./live-session";

const LOW = 0.1;
const ABOVE = 0.86;
const BUDGET = 3;
const FOUR = 4;
const FIVE = 5;

const FIELD = { path: ["utilization"], scale: "fraction" } as const;
const OPTIONS = {
  prompt: [{ role: "user", content: [{ type: "text", text: "go" }] }],
  responseFormat: { type: "json", schema: { type: "object" } },
} as V4CallOptions;

/** `utilizations[i]` is what the i-th call reports. */
const livePass = (utilizations: Array<number>, maxCalls = 50) => {
  let spawned = 0;
  const session = createLiveSession({
    spawnClaude: async () => {
      const utilization = utilizations[spawned++] ?? LOW;
      return cliRun({}, [{ status: "allowed", utilization }]);
    },
    maxCalls,
    maxWeekly: 0.85,
    field: FIELD,
  });
  const model = createClaudeCliLanguageModel({
    modelId: "claude-sonnet-5",
    call: session.call,
  });
  return { session, model, spawned: () => spawned };
};

const calling = (id: string): LiveCase => ({
  id,
  run: async (model) => {
    await model.doGenerate(OPTIONS);
    return [{ dimension: "schema", status: "passed" }];
  },
});

const cases = (n: number) =>
  Array.from({ length: n }, (_, i) => calling(`case-${i}`));

describe("runLivePass", () => {
  it("should leave the cases after a 0.86 reading unmeasured, never failed", async () => {
    // Arrange
    const { session, model } = livePass([LOW, ABOVE]);

    // Act
    const tallies = await runLivePass({
      session,
      model,
      cases: cases(FOUR),
      repetitions: 1,
    });

    // Assert
    expect(tallies.map((t) => [t.passed, t.failed, t.unmeasured])).toEqual([
      [1, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
      [0, 0, 1],
    ]);
    expect(tallies[2]?.reasons[0]).toContain("pass stopped (rate-limit)");
  });

  it("should make at most EVAL_MAX_CALLS=3 calls and report the rest unmeasured", async () => {
    // Arrange
    const { session, model, spawned } = livePass([], BUDGET);

    // Act
    const tallies = await runLivePass({
      session,
      model,
      cases: cases(FIVE),
      repetitions: 1,
    });

    // Assert
    expect(spawned()).toBe(BUDGET);
    expect(tallies.map((t) => t.unmeasured)).toEqual([0, 0, 0, 1, 1]);
    expect(tallies[3]?.reasons[0]).toContain("pass stopped (budget)");
  });

  it("should count k of n per case across repetitions", async () => {
    // Arrange
    const { session, model } = livePass([]);
    let run = 0;
    const flaky: LiveCase = {
      id: "flaky",
      run: async (m) => {
        await m.doGenerate(OPTIONS);
        return run++ % 2 === 0
          ? [{ dimension: "schema", status: "passed" }]
          : [{ dimension: "schema", status: "failed", message: "bad" }];
      },
    };

    // Act
    const [tally] = await runLivePass({
      session,
      model,
      cases: [flaky],
      repetitions: 4,
    });

    // Assert
    expect(tally).toEqual({
      id: "flaky",
      runs: 4,
      passed: 2,
      failed: 2,
      unmeasured: 0,
      reasons: ["schema: bad"],
    });
  });

  it("should fail a rejected answer but leave an unsupported call or no scorer unmeasured", async () => {
    // Arrange
    const { session, model } = livePass([]);
    const rejected: LiveCase = {
      id: "rejected",
      run: async () => {
        throw new Error("Failed after 3 attempts");
      },
    };
    const unsupported: LiveCase = {
      id: "unsupported",
      run: async () => {
        throw new UnsupportedFunctionalityError({
          functionality: "tool calling",
        });
      },
    };
    const unscored: LiveCase = { id: "unscored", run: async () => [] };

    // Act
    const tallies = await runLivePass({
      session,
      model,
      cases: [rejected, unsupported, unscored],
      repetitions: 1,
    });

    // Assert
    expect(tallies.map((t) => [t.failed, t.unmeasured])).toEqual([
      [1, 0],
      [0, 1],
      [0, 1],
    ]);
    expect(session.stopped()).toBeUndefined();
  });

  it("should stop the pass on a harness fault raised outside the session", async () => {
    // Arrange
    const { session, model } = livePass([]);
    const faulty: LiveCase = {
      id: "faulty",
      run: async () => {
        throw harnessFault("recording rejected");
      },
    };

    // Act
    const tallies = await runLivePass({
      session,
      model,
      cases: [faulty, calling("next")],
      repetitions: 1,
    });

    // Assert
    expect(session.stopped()).toEqual({
      kind: "harness-fault",
      reason: "recording rejected",
    });
    expect(tallies.map((t) => t.unmeasured)).toEqual([1, 1]);
  });
});
