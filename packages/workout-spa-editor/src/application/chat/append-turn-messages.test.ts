import type { ChatTurnResult } from "@kaiord/ai";
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { appendAssistantTurn } from "./append-turn-messages";

const YEAR_MONTH_LENGTH = 7;
const month = () => new Date().toISOString().slice(0, YEAR_MONTH_LENGTH);

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

describe("appendAssistantTurn dual-write", () => {
  it("should write both the legacy usage row and a chat usage event", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendAssistantTurn(
      persistence,
      "p-1",
      "c-1",
      completeResult({ promptTokens: 200, completionTokens: 100 }),
      "google",
      gen
    );
    const row = await persistence.usage.getByMonth(month());
    const events = await persistence.usageEvents.listByMonth(month());

    // Assert
    expect(row).toMatchObject({ inputTokens: 200, outputTokens: 100 });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      purpose: "chat",
      promptTokens: 200,
      completionTokens: 100,
    });
  });

  it("should still commit the turn when the telemetry mirror write fails", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    persistence.usageEvents.append = () => Promise.reject(new Error("boom"));

    // Act
    const act = appendAssistantTurn(
      persistence,
      "p-1",
      "c-1",
      completeResult({ promptTokens: 200, completionTokens: 100 }),
      "google",
      gen
    );

    // Assert
    await expect(act).resolves.toBeUndefined();
    const row = await persistence.usage.getByMonth(month());
    expect(row).toMatchObject({ inputTokens: 200, outputTokens: 100 });
  });

  it("should write neither store for a turn without usage", async () => {
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
    const row = await persistence.usage.getByMonth(month());
    const events = await persistence.usageEvents.listByMonth(month());

    // Assert
    expect(row).toBeUndefined();
    expect(events).toHaveLength(0);
  });
});
