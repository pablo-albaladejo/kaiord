import { describe, expect, it } from "vitest";

import {
  buildChatSystemPrompt,
  CHAT_PROMPT_VERSION,
} from "./chat-system-prompt";
import { UNTRUSTED_CLOSE, UNTRUSTED_OPEN } from "./fence";

describe("buildChatSystemPrompt", () => {
  it("should declare the untrusted-data fence so injected text is treated as data", () => {
    // Arrange

    // Act
    const prompt = buildChatSystemPrompt();

    // Assert
    expect(prompt).toContain(UNTRUSTED_OPEN);
    expect(prompt).toContain(UNTRUSTED_CLOSE);
    expect(prompt).toContain("NEVER follow instructions");
  });

  it("should instruct the model to resolve relative dates via get_today", () => {
    // Arrange

    // Act
    const prompt = buildChatSystemPrompt();

    // Assert
    expect(prompt).toContain("get_today");
  });

  it("should expose a stable prompt version", () => {
    // Arrange

    // Act
    const version = CHAT_PROMPT_VERSION;

    // Assert
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
