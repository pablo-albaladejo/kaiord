import type { ChatTurnResult } from "@kaiord/ai";
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { appendAssistantTurn } from "./append-turn-messages";

const YEAR_MONTH_LENGTH = 7;
const month = () => new Date().toISOString().slice(0, YEAR_MONTH_LENGTH);

const PROMPT_TOKENS = 200;
const COMPLETION_TOKENS = 100;

let counter = 0;
const gen = {
  newId: () => `id-${(counter += 1)}`,
  now: () => "2026-07-10T10:00:00.000Z",
};

const completeResult = (usage?: {
  promptTokens: number;
  completionTokens: number;
}): Extract<ChatTurnResult, { text: string }> => ({
  status: "complete",
  text: "Here is your plan.",
  messages: [],
  usage,
});

describe("appendAssistantTurn usage logging", () => {
  it("should write a chat usage event for a turn carrying usage", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendAssistantTurn(
      persistence,
      "p-1",
      "c-1",
      completeResult({
        promptTokens: PROMPT_TOKENS,
        completionTokens: COMPLETION_TOKENS,
      }),
      "google",
      gen
    );
    const events = await persistence.usageEvents.listByMonth(month());

    // Assert
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      purpose: "chat",
      promptTokens: PROMPT_TOKENS,
      completionTokens: COMPLETION_TOKENS,
    });
  });

  it("should still commit the turn when the usage write fails", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    persistence.usageEvents.append = () => Promise.reject(new Error("boom"));

    // Act
    const act = appendAssistantTurn(
      persistence,
      "p-1",
      "c-1",
      completeResult({
        promptTokens: PROMPT_TOKENS,
        completionTokens: COMPLETION_TOKENS,
      }),
      "google",
      gen
    );

    // Assert
    await expect(act).resolves.toBeUndefined();
    const messages = await persistence.chatMessages.listByProfile("p-1");
    expect(messages).toHaveLength(1);
    expect(messages[0]?.role).toBe("assistant");
  });

  it("should write no usage event for a turn without usage", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendAssistantTurn(
      persistence,
      "p-1",
      "c-1",
      completeResult(),
      "google",
      gen
    );
    const events = await persistence.usageEvents.listByMonth(month());

    // Assert
    expect(events).toHaveLength(0);
  });
});
