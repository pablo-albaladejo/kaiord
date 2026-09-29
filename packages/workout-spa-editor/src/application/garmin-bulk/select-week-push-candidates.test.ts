import { describe, expect, it } from "vitest";

import type { KRD } from "../../types/krd";
import { makeWorkoutRecord } from "../test-helpers";
import { selectWeekPushCandidates } from "./select-week-push-candidates";

const workout = (
  id: string,
  date: string,
  state: Parameters<typeof makeWorkoutRecord>[0]["state"]
) => makeWorkoutRecord({ id, date, state, krd: {} as KRD });

describe("selectWeekPushCandidates", () => {
  it("should list every workout of the week in calendar order", () => {
    // Arrange
    const week = [
      workout("w-3", "2026-10-07", "ready"),
      workout("w-1", "2026-10-05", "pushed"),
      workout("w-2", "2026-10-06", "structured"),
    ];

    // Act
    const candidates = selectWeekPushCandidates(week);

    // Assert
    expect(candidates).toEqual([
      { workoutId: "w-1", date: "2026-10-05" },
      { workoutId: "w-2", date: "2026-10-06" },
      { workoutId: "w-3", date: "2026-10-07" },
    ]);
  });

  it.each(["raw", "skipped", "stale"] as const)(
    "should report a %s workout as not eligible with its reason",
    (state) => {
      // Arrange
      const week = [workout("w-1", "2026-10-05", state)];

      // Act
      const [candidate] = selectWeekPushCandidates(week);

      // Assert
      expect(candidate).toEqual({
        workoutId: "w-1",
        date: "2026-10-05",
        notEligible: state,
      });
    }
  );

  it("should report a workout with no KRD as not eligible, not deleted", () => {
    // Arrange
    const week = [
      makeWorkoutRecord({ id: "w-1", date: "2026-10-05", state: "ready" }),
    ];

    // Act
    const [candidate] = selectWeekPushCandidates(week);

    // Assert
    expect(candidate.notEligible).toBe("no-krd");
  });

  it.each(["structured", "ready", "pushed", "modified"] as const)(
    "should treat a %s workout as eligible",
    (state) => {
      // Arrange
      const week = [workout("w-1", "2026-10-05", state)];

      // Act
      const [candidate] = selectWeekPushCandidates(week);

      // Assert
      expect(candidate.notEligible).toBeUndefined();
    }
  );
});
