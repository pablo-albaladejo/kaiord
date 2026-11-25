/**
 * useSplitSession — wraps the splitCoachingWorkout use case. Idempotent on
 * a missing row.
 */

import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { useSplitSession } from "./use-split-session";

describe("useSplitSession", () => {
  const wrap = (persistence = createInMemoryPersistence()) => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    );
    return { Wrapper, persistence };
  };

  it("should remove a SessionMatch row by id when the profile owns it", async () => {
    // Arrange
    const { Wrapper, persistence } = wrap();
    await persistence.sessionMatch.put({
      id: "m-1",
      profileId: "p1",
      coachingActivityId: "act-1",
      workoutId: "w-1",
      date: "2026-04-13",
      createdAt: "2026-04-13T10:00:00.000Z",
      source: "manual",
      executedWorkoutIds: [],
    });
    const { result } = renderHook(() => useSplitSession(), {
      wrapper: Wrapper,
    });

    // Act
    await act(async () => {
      await result.current({ profileId: "p1", matchId: "m-1" });
    });

    // Assert
    expect(await persistence.sessionMatch.getById("m-1")).toBeUndefined();
  });

  it("should be idempotent on a missing row (resolves without throwing)", async () => {
    // Arrange
    const { Wrapper } = wrap();

    // Act
    const { result } = renderHook(() => useSplitSession(), {
      wrapper: Wrapper,
    });

    // Assert
    await expect(
      result.current({ profileId: "p1", matchId: "missing" })
    ).resolves.toBeUndefined();
  });
});
