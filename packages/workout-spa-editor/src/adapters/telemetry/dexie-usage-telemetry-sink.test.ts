import type { AiTelemetryEvent } from "@kaiord/ai/observability";
import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { createDexieUsageTelemetrySink } from "./dexie-usage-telemetry-sink";

const YEAR_MONTH_LENGTH = 7;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const currentMonth = () => new Date().toISOString().slice(0, YEAR_MONTH_LENGTH);

const finished = (over: Partial<AiTelemetryEvent> = {}): AiTelemetryEvent => ({
  type: "run_finished",
  traceId: "t-1",
  agentId: "lab-extractor",
  agentVersion: "1.0.0",
  promptId: "lab-extractor/system",
  promptVersion: "1.0.0",
  provider: "anthropic.messages",
  modelId: "claude",
  purpose: "lab_extraction",
  latencyMs: 42,
  usage: { promptTokens: 300, completionTokens: 120 },
  ...over,
});

const fakeLogger = () => ({ warn: vi.fn() }) as unknown as Logger;

describe("createDexieUsageTelemetrySink", () => {
  it("should append an event for a finished run carrying usage", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const sink = createDexieUsageTelemetrySink(persistence);

    // Act
    sink.emit(finished());
    await flush();
    const [row] = await persistence.usageEvents.listByMonth(currentMonth());

    // Assert
    expect(row).toMatchObject({ purpose: "lab_extraction", tokens: 420 });
  });

  it("should not append anything for a failed run", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const sink = createDexieUsageTelemetrySink(persistence);

    // Act
    sink.emit({
      type: "run_failed",
      traceId: "t-1",
      agentId: "lab-extractor",
      agentVersion: "1.0.0",
      promptId: "lab-extractor/system",
      promptVersion: "1.0.0",
      provider: "anthropic.messages",
      modelId: "claude",
      purpose: "lab_extraction",
      latencyMs: 5,
      error: { name: "AiAgentError", retriable: true },
    });
    await flush();
    const rows = await persistence.usageEvents.listByMonth(currentMonth());

    // Assert
    expect(rows).toHaveLength(0);
  });

  it("should swallow a persistence rejection instead of throwing out of emit", async () => {
    // Arrange
    const logger = fakeLogger();
    const persistence = {
      usageEvents: {
        append: () => Promise.reject(new Error("boom")),
        listByMonth: async () => [],
      },
    } as unknown as PersistencePort;
    const sink = createDexieUsageTelemetrySink(persistence, logger);

    // Act
    let threw = false;
    try {
      sink.emit(finished());
    } catch {
      threw = true;
    }
    await flush();

    // Assert
    expect(threw).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("should record usage with zero cost when the provider is unmapped", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const sink = createDexieUsageTelemetrySink(persistence, fakeLogger());

    // Act
    sink.emit(finished({ provider: "mystery.model" }));
    await flush();
    const [row] = await persistence.usageEvents.listByMonth(currentMonth());

    // Assert
    expect(row).toMatchObject({ cost: 0, tokens: 420 });
  });
});
