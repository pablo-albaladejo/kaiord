import { describe, expect, it, vi } from "vitest";

import { failed } from "../garmin-placement/placement-result";
import {
  BULK_ITEM_GAP_MS,
  type SendWeekDeps,
  sendWeekToGarmin,
} from "./send-week-to-garmin";

const DATE = "2026-10-05";
const MOVED = "2026-10-07";
const week = (...ids: string[]) =>
  ids.map((workoutId) => ({ workoutId, date: DATE }));

const makeDeps = (overrides: Partial<SendWeekDeps> = {}) => {
  const calls: string[] = [];
  const deps: SendWeekDeps = {
    pushOne: vi.fn(async (id: string) => {
      calls.push(id);
      return { result: { kind: "scheduled" as const } };
    }),
    sleep: vi.fn(async () => undefined),
    isCancelled: () => false,
    ...overrides,
  };
  return { deps, calls };
};

describe("sendWeekToGarmin", () => {
  it("should push each eligible item in order with the gap between them", async () => {
    // Arrange
    const { deps, calls } = makeDeps();
    const candidates = [
      ...week("w-1"),
      { workoutId: "w-2", date: DATE, notEligible: "raw" as const },
      ...week("w-3"),
    ];

    // Act
    const run = await sendWeekToGarmin(deps, candidates);

    // Assert
    expect(calls).toEqual(["w-1", "w-3"]);
    expect(deps.sleep).toHaveBeenCalledTimes(1);
    expect(deps.sleep).toHaveBeenCalledWith(BULK_ITEM_GAP_MS);
    expect(run.outcomes.map((o) => o.status)).toEqual([
      "scheduled",
      "not-eligible",
      "scheduled",
    ]);
    expect(run.outcomes[1].notEligible).toBe("raw");
  });

  it("should continue past a failed and a thrown item", async () => {
    // Arrange
    const results = new Map([
      ["w-1", Promise.resolve(failed("needs-reauth", true))],
      ["w-2", Promise.reject(new Error("export failed"))],
    ]);
    const { deps } = makeDeps({
      pushOne: async (id) => ({
        result: await (results.get(id) ??
          Promise.resolve({ kind: "unchanged" as const })),
      }),
    });

    // Act
    const run = await sendWeekToGarmin(deps, week("w-1", "w-2", "w-3"));

    // Assert
    expect(run.outcomes.map((o) => o.result)).toEqual([
      failed("needs-reauth", true),
      failed("library-push-failed", true),
      { kind: "unchanged" },
    ]);
    expect(run.cancelled).toBe(false);
  });

  it("should stop between items once cancelled", async () => {
    // Arrange
    let cancelled = false;
    const { deps, calls } = makeDeps({ isCancelled: () => cancelled });
    deps.onOutcome = () => {
      cancelled = true;
    };

    // Act
    const run = await sendWeekToGarmin(deps, week("w-1", "w-2", "w-3"));

    // Assert
    expect(calls).toEqual(["w-1"]);
    expect(run).toMatchObject({ cancelled: true });
    expect(run.outcomes.map((o) => [o.workoutId, o.notEligible])).toEqual([
      ["w-1", undefined],
      ["w-2", "stopped"],
      ["w-3", "stopped"],
    ]);
    expect(deps.sleep).not.toHaveBeenCalled();
  });

  it("should stop when cancelled during the gap", async () => {
    // Arrange
    let cancelled = false;
    const { deps, calls } = makeDeps({
      isCancelled: () => cancelled,
      sleep: async () => {
        cancelled = true;
      },
    });

    // Act
    const run = await sendWeekToGarmin(deps, week("w-1", "w-2"));

    // Assert
    expect(calls).toEqual(["w-1"]);
    expect(run.cancelled).toBe(true);
  });

  it("should report the date the item was placed for, not its date at selection", async () => {
    // Arrange
    const { deps } = makeDeps({
      pushOne: async () => ({ result: { kind: "scheduled" }, date: MOVED }),
    });

    // Act
    const run = await sendWeekToGarmin(deps, week("w-1"));

    // Assert
    expect(run.outcomes[0].date).toBe(MOVED);
  });
});
