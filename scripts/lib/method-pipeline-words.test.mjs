import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deniedWord, pipelineWords } from "./method-pipeline-words.mjs";

describe("method-pipeline-words", () => {
  it("should split stages and words, joining single-quoted text into one word", () => {
    // Arrange
    const command = "git log abc1234 --format='%an|x y' | grep -c '\\[bot\\]$'";

    // Act
    const { stages } = pipelineWords(command);

    // Assert
    assert.deepEqual(stages, [
      ["git", "log", "abc1234", "--format=%an|x y"],
      ["grep", "-c", "\\[bot\\]$"],
    ]);
  });

  it("should refuse every character sh would read as code outside quotes", () => {
    // Arrange
    const unsafe = [
      "a; b",
      "a && b",
      "a > f",
      "a $(id)",
      "a `id`",
      'a "x"',
      "a \\x",
      "a *",
      "a\nb",
      "a 'open",
      "a |",
    ];

    // Act
    const errors = unsafe.map((c) => pipelineWords(c).error);

    // Assert
    assert.ok(errors.every(Boolean), JSON.stringify(errors));
  });

  it("should name a refused option per command, and ext:: anywhere", () => {
    // Arrange
    const stages = [
      ["git", "-c", "alias.x=!sh", "x"],
      ["git", "log", "--output=/tmp/x"],
      ["grep", "-f", "/etc/passwd"],
      ["git", "log", "ext::sh"],
      ["grep", "-c", "x"],
    ];

    // Act
    const refused = stages.map(deniedWord);

    // Assert
    assert.deepEqual(refused, [
      "-c",
      "--output=/tmp/x",
      "-f",
      "ext::sh",
      undefined,
    ]);
  });
});
