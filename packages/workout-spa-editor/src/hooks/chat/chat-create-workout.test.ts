import { describe, expect, it, vi } from "vitest";

const mockGenerate = vi.fn();

vi.mock("../../lib/generate-workout", () => ({
  generateWorkoutKrd: (...args: Array<unknown>) => mockGenerate(...args),
}));

vi.mock("../../components/pages/CreateWorkout/build-workout-record", () => ({
  buildWorkoutRecord: vi.fn(async () => ({ id: "w1", date: "2026-10-17" })),
}));

import { healthWithheldTo } from "../../application/chat/health-withheld";
import type { CreateWorkoutInput } from "../../application/chat/tools/chat-tool-deps";
import { startTraceRun } from "../../application/trace/trace-run";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import { createInMemoryTraceRepository } from "../../test-utils/in-memory-trace-repository";
import { type ChatWorkoutRun, doCreateWorkout } from "./chat-create-workout";

const INPUT = {
  description: "Rodaje 40' Z2; tu VFC de 48 ms pide suave",
  sport: "running",
} as CreateWorkoutInput;

const setUp = (generationType: "anthropic" | "openai") => {
  mockGenerate.mockReset().mockResolvedValue({ extensions: {} });
  const trace = startTraceRun({
    feature: "chat",
    traces: createInMemoryTraceRepository(),
  });
  const askHealth = vi.fn(async () => "withhold" as const);
  const run: ChatWorkoutRun = {
    persistence: { workouts: { put: vi.fn() } } as unknown as PersistencePort,
    deps: {} as never,
    profileId: "athlete-2",
    provider: { type: generationType } as LlmProviderConfig,
    modelId: "m",
    title: "Workout",
    trace,
    askHealth,
  };
  return { run, trace, askHealth };
};

describe("doCreateWorkout", () => {
  it("should generate with the zones of the profile the workout is written to", async () => {
    // Arrange
    const { run } = setUp("anthropic");

    // Act
    await doCreateWorkout(run, INPUT);

    // Assert
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: "athlete-2" })
    );
  });

  it("should refuse a description written after a health read when its Provider must not get health data", async () => {
    // Arrange
    const { run, trace, askHealth } = setUp("openai");
    trace.sent("anthropic", ["messages", "hrv", "restingHeartRate"]);

    // Act
    const created = doCreateWorkout(run, INPUT);
    const error = await created.catch((e: unknown) => e);

    // Assert
    expect(askHealth).toHaveBeenCalledWith(
      { flow: "assistantWorkout", providerType: "openai" },
      expect.anything()
    );
    expect(healthWithheldTo(error)).toBe("openai");
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(trace.sentSoFar().map((s) => s.to)).toEqual(["anthropic"]);
  });

  it("should ask a Provider never asked, and on yes record the health the description may carry", async () => {
    // Arrange
    const { run, trace, askHealth } = setUp("openai");
    trace.sent("anthropic", ["messages", "hrv"]);
    askHealth.mockResolvedValueOnce("send" as never);

    // Act
    await doCreateWorkout(run, INPUT);

    // Assert
    expect(mockGenerate).toHaveBeenCalledOnce();
    expect(trace.sentSoFar()).toContainEqual({
      to: "openai",
      kinds: ["workoutDescription"],
      declared: ["hrv"],
    });
  });

  it("should count health data an earlier reply may have quoted, though this turn read none", async () => {
    // Arrange
    const { run, askHealth } = setUp("openai");
    run.trace?.sent("anthropic", ["messages"], ["sleep", "hrv"]);

    // Act
    const error = await doCreateWorkout(run, INPUT).catch((e: unknown) => e);

    // Assert
    expect(askHealth).toHaveBeenCalledOnce();
    expect(healthWithheldTo(error)).toBe("openai");
  });

  it("should not ask again when the description goes to the Provider the turn already sent the health data to", async () => {
    // Arrange
    const { run, trace, askHealth } = setUp("anthropic");
    trace.sent("anthropic", ["messages", "hrv"]);

    // Act
    await doCreateWorkout(run, INPUT);

    // Assert
    expect(askHealth).not.toHaveBeenCalled();
    expect(mockGenerate).toHaveBeenCalledOnce();
  });

  it("should not ask when the conversation read no health data", async () => {
    // Arrange
    const { run, trace, askHealth } = setUp("openai");
    trace.sent("anthropic", ["messages", "workouts"]);

    // Act
    await doCreateWorkout(run, INPUT);

    // Assert
    expect(askHealth).not.toHaveBeenCalled();
    expect(mockGenerate).toHaveBeenCalledOnce();
  });

  it("should ask the generation Provider again when a later description may hold health data it never got", async () => {
    // Arrange
    const { run, trace, askHealth } = setUp("openai");
    trace.sent("openai", ["workoutDescription", "heartRateZones"]);
    trace.sent("anthropic", ["messages", "sleep"]);

    // Act
    const error = await doCreateWorkout(run, INPUT).catch((e: unknown) => e);

    // Assert
    expect(askHealth).toHaveBeenCalledOnce();
    expect(healthWithheldTo(error)).toBe("openai");
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("should record the health a description may hold even when its Provider already got it", async () => {
    // Arrange
    const { run, trace } = setUp("anthropic");
    trace.sent("anthropic", ["messages", "hrv"]);

    // Act
    await doCreateWorkout(run, INPUT);

    // Assert
    expect(trace.sentSoFar()).toEqual([
      { to: "anthropic", kinds: ["messages", "hrv", "workoutDescription"] },
    ]);
  });

  it("should send nothing and write no workout when stopped while the health question waits", async () => {
    // Arrange
    const { run, trace, askHealth } = setUp("openai");
    trace.sent("anthropic", ["messages", "hrv"]);
    const stop = new AbortController();
    askHealth.mockImplementationOnce(
      (_q, options) =>
        new Promise((_resolve, reject) =>
          options.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError"))
          )
        ) as never
    );

    // Act
    const created = doCreateWorkout({ ...run, signal: stop.signal }, INPUT);
    stop.abort();
    const error = await created.catch((e: unknown) => e);

    // Assert
    expect(String(error)).toMatch(/abort/i);
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(run.persistence.workouts.put).not.toHaveBeenCalled();
    expect(trace.sentSoFar().map((s) => s.to)).toEqual(["anthropic"]);
  });

  it("should not generate once stopped, and hand the generation the stop signal", async () => {
    // Arrange
    const { run } = setUp("anthropic");
    const stop = new AbortController();
    const going = { ...run, signal: stop.signal };

    // Act
    await doCreateWorkout(going, INPUT);
    stop.abort();
    const later = await doCreateWorkout(going, INPUT).catch((e: unknown) => e);

    // Assert
    expect(mockGenerate).toHaveBeenCalledOnce();
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ abortSignal: stop.signal })
    );
    expect(String(later)).toMatch(/abort/i);
  });
});
