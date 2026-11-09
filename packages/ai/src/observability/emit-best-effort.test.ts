import type { Logger } from "@kaiord/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emitBestEffort, warnBestEffort } from "./emit-best-effort";
import type { AiTelemetryEvent } from "./telemetry-types";

const EVENT = { type: "run_finished" } as AiTelemetryEvent;

const loggerWith = (warn: Logger["warn"]): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn,
  error: vi.fn(),
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("best-effort telemetry and warnings", () => {
  const unhandled: Array<unknown> = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  beforeEach(() => {
    unhandled.length = 0;
    process.on("unhandledRejection", onUnhandled);
  });

  afterEach(() => {
    process.off("unhandledRejection", onUnhandled);
  });

  it("should contain a logger whose warn returns a rejected promise", async () => {
    // Arrange
    // A plain function: vi.fn tracks returned promises and would handle them.
    let calls = 0;
    const warn = () => {
      calls += 1;
      return Promise.reject(new Error("logger down"));
    };
    const logger = loggerWith(warn as unknown as Logger["warn"]);

    // Act
    warnBestEffort(logger, "Agent attempt failed", { attempt: 1 });
    await settle();

    // Assert
    expect(calls).toBe(1);
    expect(unhandled).toEqual([]);
  });

  it("should warn with the event type when the sink returns a rejected promise", async () => {
    // Arrange
    const error = new Error("sink down");
    const sink = { emit: () => Promise.reject(error) };
    const warn = vi.fn();

    // Act
    emitBestEffort(
      sink as unknown as Parameters<typeof emitBestEffort>[0],
      EVENT,
      loggerWith(warn)
    );
    await settle();

    // Assert
    expect(warn).toHaveBeenCalledWith("Telemetry sink failed", {
      type: "run_finished",
      error,
    });
    expect(unhandled).toEqual([]);
  });

  it("should contain both a rejecting sink and a rejecting logger", async () => {
    // Arrange
    const sink = { emit: () => Promise.reject(new Error("sink down")) };
    const warn = () => Promise.reject(new Error("logger down"));

    // Act
    emitBestEffort(
      sink as unknown as Parameters<typeof emitBestEffort>[0],
      EVENT,
      loggerWith(warn as unknown as Logger["warn"])
    );
    await settle();

    // Assert
    expect(unhandled).toEqual([]);
  });

  it("should still warn synchronously when the sink throws", () => {
    // Arrange
    const error = new Error("sink down");
    const sink = {
      emit: () => {
        throw error;
      },
    };
    const warn = vi.fn();

    // Act
    emitBestEffort(sink, EVENT, loggerWith(warn));

    // Assert
    expect(warn).toHaveBeenCalledWith("Telemetry sink failed", {
      type: "run_finished",
      error,
    });
  });
});
