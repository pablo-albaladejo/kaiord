/**
 * The batch writes the AI result onto the row as stored after the AI call
 * (design §3.10, AC-25, AC-30): a move that lands during the call keeps its
 * date, and a row that left the `raw` state meanwhile is not written and
 * reports `written: false`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProcessResult } from "../../application/ai-workout-processor";
import { moveSession } from "../../application/move-session";
import {
  NOW,
  seedSession,
  THU,
  TUE,
} from "../../application/session-move.test-fixtures";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { KRD } from "../../types/krd";
import { createProcessOne } from "./batch-process-one";

const duringAiCall = vi.fn<() => Promise<void>>();

vi.mock("../../application/ai-workout-processor", () => ({
  processWorkoutWithAi: async (): Promise<ProcessResult> => {
    await duringAiCall();
    return {
      ok: true,
      krd: { version: "1.0" } as KRD,
      aiMeta: { provider: "anthropic", model: "m", processedAt: NOW },
      retried: false,
    } as ProcessResult;
  },
}));

const PROVIDER = { type: "anthropic" } as LlmProviderConfig;

describe("createProcessOne with a row changed during the AI call", () => {
  beforeEach(() => duringAiCall.mockReset());

  it("should keep a date moved during the AI call", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { state: "raw" } });
    const snapshot = await persistence.workouts.getById("w");
    duringAiCall.mockImplementation(async () => {
      await moveSession(
        { ...persistence, now: () => NOW },
        { workoutId: "w", targetDay: THU }
      );
    });
    const processOne = createProcessOne(PROVIDER, "m", persistence);

    // Act
    const result = await processOne(snapshot!, false);

    // Assert
    expect(result).toMatchObject({ ok: true, written: true });
    expect(await persistence.workouts.getById("w")).toMatchObject({
      date: THU,
      coachDate: TUE,
      state: "structured",
      krd: { version: "1.0" },
    });
  });

  it("should write nothing when the row left the raw state meanwhile", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { state: "raw" } });
    const snapshot = await persistence.workouts.getById("w");
    duringAiCall.mockImplementation(async () => {
      await persistence.workouts.put({ ...snapshot!, state: "skipped" });
    });
    const put = vi.spyOn(persistence.workouts, "put");
    const processOne = createProcessOne(PROVIDER, "m", persistence);

    // Act
    const result = await processOne(snapshot!, false);

    // Assert
    expect(result).toMatchObject({ ok: true, written: false });
    expect(put).toHaveBeenCalledTimes(1);
    expect((await persistence.workouts.getById("w"))?.state).toBe("skipped");
  });
});
