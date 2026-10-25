/**
 * A row the batch did not write, because it changed while the AI call ran,
 * is its own outcome (design §3.10, AC-30): neither succeeded nor failed.
 */
import { describe, expect, it, vi } from "vitest";

import type { BatchProgress } from "./batch-processor";
import { processBatch } from "./batch-processor";
import {
  BATCH_PROCESSOR_FAIL_RESULT as fail,
  BATCH_PROCESSOR_OK_RESULT as ok,
} from "./batch-processor.test-fixtures";
import { makeWorkoutRecord } from "./test-helpers";

describe("processBatch with a row that changed meanwhile", () => {
  it("should count an unwritten row as skipped, apart from succeeded and failed", async () => {
    // Arrange
    vi.useFakeTimers();
    const workouts = ["a", "b", "c"].map((id) => makeWorkoutRecord({ id }));
    const processOne = vi
      .fn()
      .mockResolvedValueOnce(ok)
      .mockResolvedValueOnce({ ...ok, written: false })
      .mockResolvedValueOnce(fail);
    const frames: BatchProgress[] = [];

    // Act
    const run = processBatch(
      workouts,
      processOne,
      (p) => frames.push(p),
      new AbortController().signal
    );
    await vi.runAllTimersAsync();
    const result = await run;
    vi.useRealTimers();

    // Assert
    expect(result.succeeded).toEqual(["a"]);
    expect(result.skipped).toEqual(["b"]);
    expect(result.failed.map((f) => f.id)).toEqual(["c"]);
    const last = frames.at(-1)!;
    expect(last.byId.b).toBe("skipped");
    expect(last.counts).toMatchObject({ succeeded: 1, skipped: 1, failed: 1 });
    expect(last.processed).toBe(workouts.length);
  });
});
