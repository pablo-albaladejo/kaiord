import { describe, expect, it } from "vitest";

import {
  EVALUATED_MODELS,
  getDefaultModel,
  isEvaluatedModel,
} from "../../providers";
import { COMMITTED_DIR, readCassetteFiles } from "./cassette-files";
import { loadCommittedFiles, replayCommitted } from "./committed-directory";
import { createParserReplaySuite } from "./parser-replay-suite";

// The repo's store of eval results is the committed cassettes: each model a
// committed cassette was recorded with, replayed green over every benchmark,
// has passed. A model is "evaluated" only if that store proves it.
const storedModels = () =>
  new Set(
    loadCommittedFiles(readCassetteFiles(COMMITTED_DIR)).cassettes.map(
      (c) => c.requestedModelId
    )
  );

describe("the models that passed the evals", () => {
  it("should list as evaluated exactly the models the committed results store", () => {
    // Arrange
    const listed = Object.values(EVALUATED_MODELS).flat();

    // Act
    const stored = storedModels();

    // Assert
    expect(new Set(listed)).toEqual(stored);
  });

  it("should find every evaluated model replaying green over every benchmark", async () => {
    // Arrange
    const files = readCassetteFiles(COMMITTED_DIR);
    const listed = Object.values(EVALUATED_MODELS).flat();

    // Act
    const results = await Promise.all(
      listed.map((id) => replayCommitted(createParserReplaySuite(id), files))
    );

    // Assert
    expect(listed.length).toBeGreaterThan(0);
    expect(results.map((r) => r.faults)).toEqual(listed.map(() => []));
  });

  it("should mark Google's and OpenAI's defaults not evaluated, and Anthropic's evaluated", () => {
    // Arrange
    const types = ["google", "openai", "anthropic"] as const;

    // Act
    const evaluated = types.map((t) => isEvaluatedModel(t, getDefaultModel(t)));

    // Assert
    expect(evaluated).toEqual([false, false, true]);
  });
});
