/**
 * Byte-identical migration guard. Pins the assembled text of the three prompts
 * moved into the registry so a later edit cannot silently change what the LLM
 * receives. Snapshots are the source of truth; update them only with an
 * intentional prompt change (and a version bump where a persisted
 * `promptVersion` is involved).
 */
import { describe, expect, it } from "vitest";

import { buildChatSystemPrompt } from "./chat-system-prompt";
import { WORKOUT_PARSER_SYSTEM } from "./parse-workout-prompt";
import { resolvePrompt } from "./registry";
import { buildUserPrompt } from "./user-prompt";

describe("prompt assembly snapshots", () => {
  it("should keep the workout-parser system prompt stable", () => {
    // Arrange

    // Act
    const system = resolvePrompt(WORKOUT_PARSER_SYSTEM.id, {
      vars: {
        sport:
          'The sport for this workout is "cycling". Use it for the sport field.',
      },
    });

    // Assert
    expect(system).toMatchSnapshot();
  });

  it("should keep the chat system prompt stable", () => {
    // Arrange

    // Act
    const prompt = buildChatSystemPrompt();

    // Assert
    expect(prompt).toMatchSnapshot();
  });

  it("should keep a representative generation user prompt stable", () => {
    // Arrange

    // Act
    const prompt = buildUserPrompt(
      "running",
      "Easy 10K endurance",
      ["Keep Z2", "Watch HR"],
      "Lower intensity"
    );

    // Assert
    expect(prompt).toMatchSnapshot();
  });
});
