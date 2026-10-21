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

type TextResult = Extract<ChatTurnResult, { text: string }>;

const result = (over: Partial<TextResult> = {}): TextResult =>
  ({
    status: "complete",
    text: "Here is your plan.",
    messages: [],
    ...over,
  }) as TextResult;

const persisted = async (r: TextResult) => {
  const persistence = createInMemoryPersistence();
  await appendAssistantTurn(persistence, "p-1", "c-1", r, gen);
  const [row] = await persistence.chatMessages.listByProfile("p-1");
  return row;
};

describe("appendAssistantTurn", () => {
  it("should persist a complete reply verbatim with its usage", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const usage = {
      promptTokens: PROMPT_TOKENS,
      completionTokens: COMPLETION_TOKENS,
    };

    // Act
    await appendAssistantTurn(
      persistence,
      "p-1",
      "c-1",
      result({ usage }),
      gen
    );
    const [row] = await persistence.chatMessages.listByProfile("p-1");

    // Assert
    expect(row).toMatchObject({
      role: "assistant",
      content: "Here is your plan.",
      usage,
    });
  });

  it("should leave usage logging to the telemetry sink", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const usage = {
      promptTokens: PROMPT_TOKENS,
      completionTokens: COMPLETION_TOKENS,
    };

    // Act
    await appendAssistantTurn(
      persistence,
      "p-1",
      "c-1",
      result({ usage }),
      gen
    );
    const events = await persistence.usageEvents.listByMonth(month());

    // Assert
    expect(events).toHaveLength(0);
  });

  it("should keep the partial text of a user-stopped turn with its stop reason", async () => {
    // Arrange
    const stopped = result({ status: "aborted", text: "Your week had" });

    // Act
    const row = await persisted(stopped);

    // Assert
    expect(row).toMatchObject({
      content: "Your week had",
      stopReason: "aborted",
    });
  });

  it("should store no marker text when a timed-out turn streamed nothing", async () => {
    // Arrange
    const stopped = result({ status: "timeout", text: "" });

    // Act
    const row = await persisted(stopped);

    // Assert
    expect(row).toMatchObject({ content: "", stopReason: "timeout" });
  });

  it("should append the legacy step-limit marker and no stop reason", async () => {
    // Arrange
    const limited = result({ status: "step_limit", text: "Partial" });

    // Act
    const row = await persisted(limited);

    // Assert
    expect(row?.content).toBe("Partial\n\n(Stopped: reached the step limit.)");
    expect(row?.stopReason).toBeUndefined();
  });

  it("should leave the stop reason unset on a complete reply", async () => {
    // Arrange
    const complete = result();

    // Act
    const row = await persisted(complete);

    // Assert
    expect(row?.stopReason).toBeUndefined();
  });
});
