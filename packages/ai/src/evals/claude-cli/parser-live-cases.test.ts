import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import { simpleWorkout } from "../../test-utils/cassette-builder";
import { createParserReplaySuite } from "../cassettes/parser-replay-suite";
import benchmarks from "../benchmarks.json";
import type { Benchmark } from "../types";
import { serialize } from "./cassette-writer";
import { createClaudeCliLanguageModel } from "./claude-cli-language-model";
import { parserLiveCases, recordingLiveCases } from "./parser-live-cases";

/** One call plus the runtime's two validation retries. */
const PRODUCTION_ATTEMPTS = 3;

const cycling = (benchmarks as Array<Benchmark>).filter(
  (b) => b.id === "cycling-simple"
);

const cliModel = (modelId: string, output: unknown) => {
  let calls = 0;
  const model = createClaudeCliLanguageModel({
    modelId,
    call: async () => {
      calls++;
      return cliRun({
        structuredOutput: output,
        modelUsage: { [modelId]: { inputTokens: 1 } },
      });
    },
  });
  return { model, calls: () => calls };
};

let root: string;

describe("parser live cases", () => {
  beforeEach(() => {
    vi.stubGlobal("AI_SDK_LOG_WARNINGS", false);
    root = mkdtempSync(join(tmpdir(), "live-cases-"));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    rmSync(root, { recursive: true, force: true });
  });

  it("should measure with production retries, each one a model call", async () => {
    // Arrange
    const { model, calls } = cliModel("claude-sonnet-5", {
      sport: "cycling",
      steps: "none",
    });
    const [liveCase] = parserLiveCases(cycling);

    // Act
    const outcome = await liveCase?.run(model).catch(() => "rejected");

    // Assert
    expect(outcome).toBe("rejected");
    expect(calls()).toBe(PRODUCTION_ATTEMPTS);
  });

  it("should score a valid answer", async () => {
    // Arrange
    const { model } = cliModel("claude-sonnet-5", simpleWorkout("cycling"));
    const [liveCase] = parserLiveCases(cycling);

    // Act
    const outcomes = await liveCase?.run(model);

    // Assert
    expect(outcomes?.some((o) => o.status === "passed")).toBe(true);
  });

  it("should record one cassette per case into the iteration directory for another model", async () => {
    // Arrange
    const suite = createParserReplaySuite("claude-haiku-4-5", cycling);
    const { model, calls } = cliModel(
      "claude-haiku-4-5",
      simpleWorkout("cycling")
    );
    const targets = {
      committedDir: join(root, "committed"),
      iterationDir: join(root, "iteration"),
      servedForm: null,
    };
    mkdirSync(targets.committedDir);
    writeFileSync(
      join(targets.committedDir, "manifest.json"),
      serialize({ cassettes: [] })
    );
    const written: Array<string> = [];
    const [liveCase] = recordingLiveCases(suite, targets, (p) =>
      written.push(p)
    );

    // Act
    const outcomes = await liveCase?.run(model);

    // Assert
    expect(calls()).toBe(1);
    expect(outcomes?.some((o) => o.status === "passed")).toBe(true);
    expect(written).toHaveLength(1);
    expect(readdirSync(targets.iterationDir)).toHaveLength(1);
    expect(readdirSync(targets.committedDir)).toEqual(["manifest.json"]);
  });

  it("should write the cassette of a rejected answer and then report the failure", async () => {
    // Arrange
    const suite = createParserReplaySuite("claude-haiku-4-5", cycling);
    const { model } = cliModel("claude-haiku-4-5", {
      sport: "cycling",
      steps: "none",
    });
    const targets = {
      committedDir: join(root, "c"),
      iterationDir: join(root, "i"),
      servedForm: null,
    };
    const [liveCase] = recordingLiveCases(suite, targets);

    // Act
    const outcome = await liveCase?.run(model).catch(() => "rejected");

    // Assert
    expect(outcome).toBe("rejected");
    expect(readdirSync(targets.iterationDir)).toHaveLength(1);
  });
});
