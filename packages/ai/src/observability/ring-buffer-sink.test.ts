import { describe, it, expect } from "vitest";
import { createRingBufferTelemetrySink } from "./ring-buffer-sink";
import type { AiTelemetryEvent } from "./telemetry-types";

const FINISHED: AiTelemetryEvent = {
  type: "run_finished",
  traceId: "t1",
  agentId: "lab-extractor",
  agentVersion: "1.0.0",
  promptId: "lab-extractor/system",
  promptVersion: "1.0.0",
  provider: "anthropic.messages",
  modelId: "claude-x",
  purpose: "lab_extraction",
  latencyMs: 12,
  usage: { promptTokens: 10, completionTokens: 5 },
};

describe("createRingBufferTelemetrySink", () => {
  it("should return emitted events oldest first", () => {
    // Arrange
    const sink = createRingBufferTelemetrySink();

    // Act
    sink.emit(FINISHED);
    sink.emit({ ...FINISHED, traceId: "t2" });

    // Assert
    expect(sink.events().map((e) => e.traceId)).toEqual(["t1", "t2"]);
  });

  it("should drop the oldest event beyond capacity", () => {
    // Arrange
    const sink = createRingBufferTelemetrySink(2);

    // Act
    sink.emit({ ...FINISHED, traceId: "a" });
    sink.emit({ ...FINISHED, traceId: "b" });
    sink.emit({ ...FINISHED, traceId: "c" });

    // Assert
    expect(sink.events().map((e) => e.traceId)).toEqual(["b", "c"]);
  });

  it("should expose a copy that does not mutate the buffer", () => {
    // Arrange
    const sink = createRingBufferTelemetrySink();
    sink.emit(FINISHED);

    // Act
    sink.events().push({ ...FINISHED, traceId: "leak" });

    // Assert
    expect(sink.events()).toHaveLength(1);
  });

  it("should empty the buffer on clear", () => {
    // Arrange
    const sink = createRingBufferTelemetrySink();
    sink.emit(FINISHED);

    // Act
    sink.clear();

    // Assert
    expect(sink.events()).toHaveLength(0);
  });
});
