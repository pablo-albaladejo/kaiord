import { describe, it, expect, vi } from "vitest";
import { createConsoleTelemetrySink } from "./console-sink";
import type { AiTelemetryEvent } from "./telemetry-types";

const BASE = {
  traceId: "t1",
  agentId: "workout-parser",
  agentVersion: "1.0.0",
  promptId: "workout-parser/system",
  promptVersion: "1.0.0",
  provider: "anthropic.messages",
  modelId: "claude-x",
  purpose: "workout_generation" as const,
  latencyMs: 20,
};

const buildLogger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("createConsoleTelemetrySink", () => {
  it("should log finished runs at debug level", () => {
    // Arrange
    const logger = buildLogger();
    const sink = createConsoleTelemetrySink(logger);
    const event: AiTelemetryEvent = { type: "run_finished", ...BASE };

    // Act
    sink.emit(event);

    // Assert
    expect(logger.debug).toHaveBeenCalledOnce();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("should log failed runs at warn level", () => {
    // Arrange
    const logger = buildLogger();
    const sink = createConsoleTelemetrySink(logger);
    const event: AiTelemetryEvent = {
      type: "run_failed",
      ...BASE,
      error: { name: "AiAgentError", retriable: false },
    };

    // Act
    sink.emit(event);

    // Assert
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it("should not throw when no logger is provided", () => {
    // Arrange
    const sink = createConsoleTelemetrySink();
    const event: AiTelemetryEvent = { type: "run_finished", ...BASE };
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});

    // Act
    const act = () => sink.emit(event);

    // Assert
    expect(act).not.toThrow();
    spy.mockRestore();
  });
});
