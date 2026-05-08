import { describe, expect, it, vi } from "vitest";

import type { ProcessResult } from "./ai-workout-processor";
import { processBatch } from "./batch-processor";
import {
  BATCH_PROCESSOR_COUNTS as COUNTS,
  BATCH_PROCESSOR_FAIL_RESULT as fail,
  BATCH_PROCESSOR_IDS as IDS,
  BATCH_PROCESSOR_META as META,
  BATCH_PROCESSOR_OK_RESULT as ok,
  BATCH_PROCESSOR_TIMING_MS as TIMING,
} from "./batch-processor.test-fixtures";
import { makeWorkoutRecord } from "./test-helpers";

function makeWorkouts(count: number) {
  return Array.from({ length: count }, (_, i) =>
    makeWorkoutRecord({
      id: `${IDS.workoutIdPrefix}${i}`,
    })
  );
}

describe("processBatch", () => {
  it("should process all workouts successfully", async () => {
    // Arrange
    const workouts = makeWorkouts(COUNTS.three);
    const processOne = vi.fn().mockResolvedValue(ok);
    const onProgress = vi.fn();

    // Act
    const result = await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    // Assert
    expect(result.succeeded).toHaveLength(COUNTS.three);
    expect(result.failed).toHaveLength(0);
    expect(result.cancelled).toBe(false);
  });

  it("should continue on failure", async () => {
    // Arrange
    const workouts = makeWorkouts(COUNTS.three);
    const processOne = vi
      .fn()
      .mockResolvedValueOnce(ok)
      .mockResolvedValueOnce(fail)
      .mockResolvedValueOnce(ok);
    const onProgress = vi.fn();

    // Act
    const result = await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    // Assert
    expect(result.succeeded).toHaveLength(COUNTS.two);
    expect(result.failed).toHaveLength(COUNTS.one);
    expect(result.failed[0].error).toBe(META.errorMessage);
  });

  it("should stop on abort signal", async () => {
    // Arrange
    const workouts = makeWorkouts(COUNTS.five);
    const controller = new AbortController();
    let callCount = 0;
    const processOne = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === COUNTS.two) controller.abort();
      return ok;
    });

    // Act
    const result = await processBatch(
      workouts,
      processOne,
      vi.fn(),
      controller.signal
    );

    // Assert
    expect(result.cancelled).toBe(true);
    expect(processOne).toHaveBeenCalledTimes(COUNTS.two);
  });

  it("should report progress after each item", async () => {
    // Arrange
    const workouts = makeWorkouts(COUNTS.two);
    const processOne = vi.fn().mockResolvedValue(ok);
    const onProgress = vi.fn();
    await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );
    expect(onProgress).toHaveBeenCalledTimes(COUNTS.four);
    const firstBefore = onProgress.mock.calls[0][0];
    expect(firstBefore.current).toBe(workouts[0].id);
    expect(firstBefore.processed).toBe(0);

    // Act
    const firstAfter = onProgress.mock.calls[1][0];

    // Assert
    expect(firstAfter.current).toBeNull();
    expect(firstAfter.processed).toBe(COUNTS.one);
  });

  it("should wait 500ms between API calls", async () => {
    // Arrange
    vi.useFakeTimers();
    const workouts = makeWorkouts(COUNTS.two);
    const processOne = vi.fn().mockResolvedValue(ok);
    const promise = processBatch(
      workouts,
      processOne,
      vi.fn(),
      new AbortController().signal
    );
    await vi.advanceTimersByTimeAsync(TIMING.zero);
    expect(processOne).toHaveBeenCalledTimes(COUNTS.one);
    await vi.advanceTimersByTimeAsync(TIMING.apiCallSpacing);
    await vi.advanceTimersByTimeAsync(TIMING.zero);
    expect(processOne).toHaveBeenCalledTimes(COUNTS.two);
    await promise;

    // Act
    vi.useRealTimers();

    // Assert
  });

  it("should report per-workout status via byId (queued → processing → succeeded)", async () => {
    // Arrange
    const workouts = makeWorkouts(COUNTS.two);
    const processOne = vi.fn().mockResolvedValue(ok);
    const onProgress = vi.fn();
    await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );
    const [w0, w1] = workouts;
    const frames = onProgress.mock.calls.map((c) => c[0]);
    expect(frames[0].byId[w0.id]).toBe("processing");
    expect(frames[0].byId[w1.id]).toBe("queued");
    expect(frames[0].counts.queued).toBe(COUNTS.one);
    expect(frames[0].counts.processing).toBe(COUNTS.one);
    expect(frames[1].byId[w0.id]).toBe("succeeded");
    expect(frames[1].byId[w1.id]).toBe("queued");
    expect(frames[1].counts.succeeded).toBe(COUNTS.one);

    // Act
    const last = frames[frames.length - 1];

    // Assert
    expect(last.byId[w0.id]).toBe("succeeded");
    expect(last.byId[w1.id]).toBe("succeeded");
    expect(last.counts.succeeded).toBe(COUNTS.two);
    expect(last.counts.queued).toBe(0);
    expect(last.counts.processing).toBe(0);
  });

  it("should record 'failed' per-workout status on processOne failure", async () => {
    // Arrange
    const workouts = makeWorkouts(COUNTS.two);
    const processOne = vi
      .fn()
      .mockResolvedValueOnce(fail)
      .mockResolvedValueOnce(ok);
    const onProgress = vi.fn();
    await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    // Act
    const last = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];

    // Assert
    expect(last.byId[workouts[0].id]).toBe("failed");
    expect(last.byId[workouts[1].id]).toBe("succeeded");
    expect(last.counts.failed).toBe(COUNTS.one);
    expect(last.counts.succeeded).toBe(COUNTS.one);
  });

  it("should include every workout as queued in initial frames before processing starts", async () => {
    // Arrange
    const workouts = makeWorkouts(COUNTS.three);
    const processOne = vi.fn().mockResolvedValue(ok);
    const onProgress = vi.fn();
    await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    // Act
    const firstFrame = onProgress.mock.calls[0][0];

    // Assert
    expect(firstFrame.total).toBe(COUNTS.three);
    expect(Object.keys(firstFrame.byId)).toHaveLength(COUNTS.three);
    expect(firstFrame.counts.queued + firstFrame.counts.processing).toBe(
      COUNTS.three
    );
  });

  it("should have byId snapshots isolated — later mutations don't leak back", async () => {
    // Arrange
    const workouts = makeWorkouts(COUNTS.two);
    const processOne = vi.fn().mockResolvedValue(ok);
    const frames: Array<Record<string, string>> = [];
    const onProgress = (p: { byId: Record<string, string> }) => {
      frames.push(p.byId);
    };

    // Act
    await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    // Assert
    expect(frames[0][workouts[0].id]).toBe("processing");
  });

  it("should pass allowRetry=true until budget exhausted", async () => {
    // Arrange
    const workouts = makeWorkouts(COUNTS.five);
    const retriedResult: ProcessResult = {
      ok: true,
      krd: ok.ok
        ? ok.krd
        : {
            version: META.krdVersion,
            type: "structured_workout",
            metadata: {
              created: META.processedAt,
              sport: META.krdSport,
            },
          },
      aiMeta: {
        promptVersion: META.promptVersion,
        model: META.model,
        provider: META.provider,
        processedAt: META.processedAt,
      },
      retried: true,
    };
    const processOne = vi
      .fn()
      .mockResolvedValueOnce(retriedResult) // retry 1
      .mockResolvedValueOnce(retriedResult) // retry 2
      .mockResolvedValueOnce(retriedResult) // retry 3
      .mockResolvedValue(ok);

    // Act
    await processBatch(
      workouts,
      processOne,
      vi.fn(),
      new AbortController().signal
    );

    // Assert
    expect(processOne.mock.calls[0][1]).toBe(true);
    expect(processOne.mock.calls[1][1]).toBe(true);
    expect(processOne.mock.calls[2][1]).toBe(true);
    expect(processOne.mock.calls[3][1]).toBe(false);
    expect(processOne.mock.calls[4][1]).toBe(false);
  });
});
