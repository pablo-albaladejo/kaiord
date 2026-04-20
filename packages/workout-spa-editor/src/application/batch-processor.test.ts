import { describe, expect, it, vi } from "vitest";

import type { ProcessResult } from "./ai-workout-processor";
import { processBatch } from "./batch-processor";
import { makeWorkoutRecord } from "./test-helpers";

function makeWorkouts(count: number) {
  return Array.from({ length: count }, (_, i) =>
    makeWorkoutRecord({
      id: `550e8400-e29b-41d4-a716-44665544000${i}`,
    })
  );
}

const ok: ProcessResult = {
  ok: true,
  krd: {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport: "running" },
  },
  aiMeta: {
    promptVersion: "1.0.0",
    model: "m",
    provider: "p",
    processedAt: "2025-01-01T00:00:00Z",
  },
  retried: false,
};

const fail: ProcessResult = { ok: false, error: "LLM error", retried: false };

describe("processBatch", () => {
  it("processes all workouts successfully", async () => {
    const workouts = makeWorkouts(3);
    const processOne = vi.fn().mockResolvedValue(ok);
    const onProgress = vi.fn();

    const result = await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    expect(result.succeeded).toHaveLength(3);
    expect(result.failed).toHaveLength(0);
    expect(result.cancelled).toBe(false);
  });

  it("continues on failure", async () => {
    const workouts = makeWorkouts(3);
    const processOne = vi
      .fn()
      .mockResolvedValueOnce(ok)
      .mockResolvedValueOnce(fail)
      .mockResolvedValueOnce(ok);
    const onProgress = vi.fn();

    const result = await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toBe("LLM error");
  });

  it("stops on abort signal", async () => {
    const workouts = makeWorkouts(5);
    const controller = new AbortController();
    let callCount = 0;
    const processOne = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 2) controller.abort();
      return ok;
    });

    const result = await processBatch(
      workouts,
      processOne,
      vi.fn(),
      controller.signal
    );

    expect(result.cancelled).toBe(true);
    expect(processOne).toHaveBeenCalledTimes(2);
  });

  it("reports progress after each item", async () => {
    const workouts = makeWorkouts(2);
    const processOne = vi.fn().mockResolvedValue(ok);
    const onProgress = vi.fn();

    await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    // 2 calls per workout: before (current set) + after (current null)
    expect(onProgress).toHaveBeenCalledTimes(4);

    const firstBefore = onProgress.mock.calls[0][0];
    expect(firstBefore.current).toBe(workouts[0].id);
    expect(firstBefore.processed).toBe(0);

    const firstAfter = onProgress.mock.calls[1][0];
    expect(firstAfter.current).toBeNull();
    expect(firstAfter.processed).toBe(1);
  });

  it("waits 500ms between API calls", async () => {
    vi.useFakeTimers();
    const workouts = makeWorkouts(2);
    const processOne = vi.fn().mockResolvedValue(ok);

    const promise = processBatch(
      workouts,
      processOne,
      vi.fn(),
      new AbortController().signal
    );

    await vi.advanceTimersByTimeAsync(0);
    expect(processOne).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(0);
    expect(processOne).toHaveBeenCalledTimes(2);

    await promise;
    vi.useRealTimers();
  });

  it("reports per-workout status via byId (queued → processing → succeeded)", async () => {
    const workouts = makeWorkouts(2);
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

    // First frame: w0 processing, w1 queued
    expect(frames[0].byId[w0.id]).toBe("processing");
    expect(frames[0].byId[w1.id]).toBe("queued");
    expect(frames[0].counts.queued).toBe(1);
    expect(frames[0].counts.processing).toBe(1);

    // After w0 done: succeeded=1, next w1 queued
    expect(frames[1].byId[w0.id]).toBe("succeeded");
    expect(frames[1].byId[w1.id]).toBe("queued");
    expect(frames[1].counts.succeeded).toBe(1);

    // Final frame: both succeeded
    const last = frames[frames.length - 1];
    expect(last.byId[w0.id]).toBe("succeeded");
    expect(last.byId[w1.id]).toBe("succeeded");
    expect(last.counts.succeeded).toBe(2);
    expect(last.counts.queued).toBe(0);
    expect(last.counts.processing).toBe(0);
  });

  it("records 'failed' per-workout status on processOne failure", async () => {
    const workouts = makeWorkouts(2);
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

    const last = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
    expect(last.byId[workouts[0].id]).toBe("failed");
    expect(last.byId[workouts[1].id]).toBe("succeeded");
    expect(last.counts.failed).toBe(1);
    expect(last.counts.succeeded).toBe(1);
  });

  it("initial frames include every workout as queued before processing starts", async () => {
    const workouts = makeWorkouts(3);
    const processOne = vi.fn().mockResolvedValue(ok);
    const onProgress = vi.fn();

    await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    const firstFrame = onProgress.mock.calls[0][0];

    // Three workouts total, one immediately flipped to processing,
    // the remaining two still queued.
    expect(firstFrame.total).toBe(3);
    expect(Object.keys(firstFrame.byId)).toHaveLength(3);
    expect(firstFrame.counts.queued + firstFrame.counts.processing).toBe(3);
  });

  it("byId snapshots are isolated — later mutations don't leak back", async () => {
    const workouts = makeWorkouts(2);
    const processOne = vi.fn().mockResolvedValue(ok);
    const frames: Array<Record<string, string>> = [];
    const onProgress = (p: { byId: Record<string, string> }) => {
      frames.push(p.byId);
    };

    await processBatch(
      workouts,
      processOne,
      onProgress,
      new AbortController().signal
    );

    // The first frame must still report w0 as "processing", not
    // "succeeded" — each emit should be a fresh snapshot.
    expect(frames[0][workouts[0].id]).toBe("processing");
  });

  it("passes allowRetry=true until budget exhausted", async () => {
    const workouts = makeWorkouts(5);
    const retriedResult: ProcessResult = {
      ok: true,
      krd: ok.ok
        ? ok.krd
        : {
            version: "1.0",
            type: "structured_workout",
            metadata: { created: "2025-01-01T00:00:00Z", sport: "running" },
          },
      aiMeta: {
        promptVersion: "1.0.0",
        model: "m",
        provider: "p",
        processedAt: "2025-01-01T00:00:00Z",
      },
      retried: true,
    };

    const processOne = vi
      .fn()
      .mockResolvedValueOnce(retriedResult) // retry 1
      .mockResolvedValueOnce(retriedResult) // retry 2
      .mockResolvedValueOnce(retriedResult) // retry 3
      .mockResolvedValue(ok); // no more retries allowed

    await processBatch(
      workouts,
      processOne,
      vi.fn(),
      new AbortController().signal
    );

    // First 3 calls: allowRetry=true (budget available)
    expect(processOne.mock.calls[0][1]).toBe(true);
    expect(processOne.mock.calls[1][1]).toBe(true);
    expect(processOne.mock.calls[2][1]).toBe(true);
    // After 3 retries used: allowRetry=false
    expect(processOne.mock.calls[3][1]).toBe(false);
    expect(processOne.mock.calls[4][1]).toBe(false);
  });
});
