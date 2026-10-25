/**
 * The calendar auto-link seeds its dedup with the ids another week's match
 * holds (design §3.7, AC-8), so it never proposes them for this week's match.
 */
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { ActivityRecord } from "../types/activity-record";
import type { WorkoutRecord } from "../types/calendar-record";
import type { SessionMatch } from "../types/session-match";
import { useExecutedMatchAuto } from "./use-executed-match-auto";

const THU = "2026-10-15";

const match = {
  id: "M2",
  profileId: "p1",
  coachingActivityId: "p1:train2go:2",
  workoutId: "w2",
  date: THU,
  createdAt: "2026-10-01T08:00:00.000Z",
  source: "auto-coaching",
  executedWorkoutIds: [],
} as SessionMatch;

const planned = [
  { id: "w2", date: THU, sport: "cycling", state: "ready" },
] as WorkoutRecord[];

const recordings = [
  { id: "R", profileId: "p1", date: THU, sport: "cycling" },
  { id: "S", profileId: "p1", date: THU, sport: "cycling" },
] as ActivityRecord[];

const renderAuto = (held?: ReadonlySet<string>) => {
  const persistence = createInMemoryPersistence();
  const append = vi
    .spyOn(persistence.sessionMatch, "appendExecutedWorkoutIds")
    .mockResolvedValue();
  renderHook(() => useExecutedMatchAuto([match], planned, recordings, held), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    ),
  });
  return append;
};

describe("useExecutedMatchAuto with ids held in another week", () => {
  it("should append only the recordings no other week holds", async () => {
    // Arrange
    const held = new Set(["R"]);

    // Act
    const append = renderAuto(held);

    // Assert
    await waitFor(() => expect(append).toHaveBeenCalledWith("M2", ["S"]));
    expect(append).toHaveBeenCalledTimes(1);
  });
});
