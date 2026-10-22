import { describe, expect, it } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import { createClaudeCliLanguageModel } from "./claude-cli-language-model";
import type { V4CallOptions } from "./language-model-types";
import { createRecordingModel } from "./recording-model";

const OPTIONS = {
  prompt: [{ role: "user", content: [{ type: "text", text: "go" }] }],
  responseFormat: { type: "json", schema: { type: "object" } },
} as V4CallOptions;

describe("createRecordingModel", () => {
  it("should keep each successful call with the exact options sent", async () => {
    // Arrange
    const inner = createClaudeCliLanguageModel({
      modelId: "claude-sonnet-5",
      call: async () => cliRun(),
    });
    const recording = createRecordingModel(inner);

    // Act
    const result = await recording.model.doGenerate(OPTIONS);

    // Assert
    expect(recording.model.modelId).toBe("claude-sonnet-5");
    expect(recording.model.provider).toBe("claude-cli");
    expect(recording.calls()).toEqual([{ options: OPTIONS, result }]);
  });

  it("should not keep a call that failed, and should delegate streaming", async () => {
    // Arrange
    const inner = createClaudeCliLanguageModel({
      modelId: "claude-sonnet-5",
      call: async () => {
        throw new Error("spawn failed");
      },
    });
    const recording = createRecordingModel(inner);

    // Act
    const generate = await recording.model
      .doGenerate(OPTIONS)
      .catch((e: Error) => e.message);
    const stream = await recording.model
      .doStream(OPTIONS)
      .catch(() => "unsupported");

    // Assert
    expect(generate).toBe("spawn failed");
    expect(stream).toBe("unsupported");
    expect(recording.calls()).toEqual([]);
  });
});
