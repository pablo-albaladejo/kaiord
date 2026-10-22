import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import benchmarks from "../benchmarks.json";
import { createTextToWorkout } from "../../adapters/text-to-workout";
import { createParserReplaySuite } from "../cassettes/parser-replay-suite";
import type { Benchmark } from "../types";
import { createClaudeCliLanguageModel } from "./claude-cli-language-model";
import { unsupported } from "./claude-request";
import { harnessFault } from "./harness-fault";
import { runLivePass } from "./live-pass";
import type { LiveCase } from "./live-pass";
import { createLiveSession } from "./live-session";
import { parserLiveCases, recordingLiveCases } from "./parser-live-cases";

const MODEL = "claude-sonnet-5";
const cycling = (benchmarks as Array<Benchmark>).filter(
  (b) => b.id === "cycling-simple"
);
let root: string;

/** A pass whose model call throws `error`, wrapped by the parser runtime. */
const passThrowing = async (
  error: Error,
  cases: (dir: string) => Array<LiveCase>
) => {
  const session = createLiveSession({
    spawnClaude: async () => cliRun(),
    maxCalls: 50,
    maxWeekly: 0.85,
    field: { path: ["utilization"], scale: "fraction" },
  });
  const model = createClaudeCliLanguageModel({
    modelId: MODEL,
    call: async () => {
      throw error;
    },
  });
  const [tally] = await runLivePass({
    session,
    model,
    cases: cases(root),
    repetitions: 1,
  });
  return { tally, stop: session.stopped() };
};

const measuring = () => parserLiveCases(cycling);
const doublyWrapped = (): Array<LiveCase> => [
  {
    id: "wrapped",
    run: async (model) => {
      try {
        await createTextToWorkout({ model })("30 min easy ride");
      } catch (error) {
        throw new Error("the case wrapped the runtime's error", {
          cause: error,
        });
      }
      return [];
    },
  },
];
const recording = (dir: string) => {
  const suite = createParserReplaySuite(MODEL);
  return recordingLiveCases(
    { ...suite, cases: suite.cases.filter((c) => c.id === "cycling-simple") },
    {
      committedDir: join(dir, "c"),
      iterationDir: join(dir, "i"),
      servedForm: null,
    }
  );
};

describe("errors the runtime wraps", () => {
  beforeEach(() => {
    vi.stubGlobal("AI_SDK_LOG_WARNINGS", false);
    root = mkdtempSync(join(tmpdir(), "live-causes-"));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    rmSync(root, { recursive: true, force: true });
  });

  it("should leave an unsupported measured call unmeasured, not failed", async () => {
    // Arrange
    const error = unsupported("tool calling");

    // Act
    const { tally } = await passThrowing(error, measuring);

    // Assert
    expect(tally).toMatchObject({ runs: 1, unmeasured: 1, failed: 0 });
    expect(tally?.reasons.join()).toContain("tool calling");
  });

  it("should leave an unsupported recorded call unmeasured, not failed", async () => {
    // Arrange
    const error = unsupported("file parts");

    // Act
    const { tally } = await passThrowing(error, recording);

    // Assert
    expect(tally).toMatchObject({ runs: 1, unmeasured: 1, failed: 0 });
    expect(tally?.reasons.join()).toContain("file parts");
  });

  it("should stop the pass on a harness fault raised outside the session", async () => {
    // Arrange
    const error = harnessFault("the stream had no result message");

    // Act
    const { tally, stop } = await passThrowing(error, measuring);

    // Assert
    expect(tally).toMatchObject({ runs: 1, unmeasured: 1, failed: 0 });
    expect(stop).toEqual({
      kind: "harness-fault",
      reason: "the stream had no result message",
    });
  });

  it("should still classify an unsupported call under a second wrap", async () => {
    // Arrange
    const error = unsupported("tool calling");

    // Act
    const { tally } = await passThrowing(error, doublyWrapped);

    // Assert
    expect(tally).toMatchObject({ runs: 1, unmeasured: 1, failed: 0 });
  });
});
