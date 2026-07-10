/**
 * Fold-vs-legacy parity gate: over a real dual-write chat session the
 * chat-scoped fold of `usageEvents` MUST equal the live `usage` row that
 * `recordChatUsage` produced — token counts exactly, cost within 1e-9. This is
 * the invariant that lets a follow-up change retire the legacy writer.
 */
import type { ChatTurnResult } from "@kaiord/ai";
import { describe, expect, it } from "vitest";

import type { LlmProviderType } from "../../store/ai-store-types";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { appendAssistantTurn } from "../chat/append-turn-messages";
import { appendUsageEvent } from "./append-usage-event";
import { foldUsageEvents } from "./fold-usage-events";

const COST_TOLERANCE = 1e-9;
const YEAR_MONTH_LENGTH = 7;
const month = () => new Date().toISOString().slice(0, YEAR_MONTH_LENGTH);

let counter = 0;
const gen = {
  newId: () => `id-${(counter += 1)}`,
  now: () => "2026-07-10T10:00:00.000Z",
};

type Turn = {
  providerType: LlmProviderType;
  promptTokens: number;
  completionTokens: number;
};

const SESSION: Turn[] = [
  { providerType: "anthropic", promptTokens: 150, completionTokens: 60 },
  { providerType: "google", promptTokens: 200, completionTokens: 90 },
  { providerType: "openai", promptTokens: 75, completionTokens: 25 },
];

const result = (t: Turn): Extract<ChatTurnResult, { text: string }> => ({
  status: "complete",
  text: "ok",
  messages: [],
  usage: { promptTokens: t.promptTokens, completionTokens: t.completionTokens },
});

const runSession = async (
  persistence: ReturnType<typeof createInMemoryPersistence>
): Promise<void> => {
  for (const t of SESSION) {
    await appendAssistantTurn(
      persistence,
      "p-1",
      "c-1",
      result(t),
      t.providerType,
      gen
    );
  }
};

describe("usage accounting fold-vs-legacy parity", () => {
  it("should match the live usage row for a chat-only session", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await runSession(persistence);
    const row = await persistence.usage.getByMonth(month());
    const events = await persistence.usageEvents.listByMonth(month());
    const fold = foldUsageEvents(events, { purpose: "chat" });

    // Assert
    expect(fold.inputTokens).toBe(row?.inputTokens);
    expect(fold.outputTokens).toBe(row?.outputTokens);
    expect(fold.totalTokens).toBe(row?.totalTokens);
    expect(
      Math.abs(fold.totalCost - (row?.totalCost ?? 0))
    ).toBeLessThanOrEqual(COST_TOLERANCE);
  });

  it("should keep chat parity and leave the usage row untouched when non-chat runs are logged", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await runSession(persistence);
    const rowBefore = await persistence.usage.getByMonth(month());

    // Act
    await appendUsageEvent(persistence, {
      purpose: "workout_generation",
      providerType: "anthropic",
      promptTokens: 500,
      completionTokens: 400,
    });
    await appendUsageEvent(persistence, {
      purpose: "lab_extraction",
      providerType: "google",
      promptTokens: 900,
      completionTokens: 100,
    });
    const rowAfter = await persistence.usage.getByMonth(month());
    const events = await persistence.usageEvents.listByMonth(month());
    const fold = foldUsageEvents(events, { purpose: "chat" });

    // Assert
    expect(rowAfter).toEqual(rowBefore);
    expect(fold.totalTokens).toBe(rowBefore?.totalTokens);
    expect(
      Math.abs(fold.totalCost - (rowBefore?.totalCost ?? 0))
    ).toBeLessThanOrEqual(COST_TOLERANCE);
  });
});
