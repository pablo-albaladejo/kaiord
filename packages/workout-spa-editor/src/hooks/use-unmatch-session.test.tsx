/**
 * useUnmatchSession — wraps the unmatchSession use case with
 * `persistence.transaction(...)`. Idempotent on a missing row.
 */

import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { useUnmatchSession } from "./use-unmatch-session";

describe("useUnmatchSession", () => {
  const wrap = (persistence = createInMemoryPersistence()) => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    );
    return { Wrapper, persistence };
  };

  it("removes a SessionMatch row by id when the profile owns it", async () => {
    const { Wrapper, persistence } = wrap();
    await persistence.sessionMatch.put({
      id: "m-1",
      profileId: "p1",
      coachingActivityId: "act-1",
      workoutId: "w-1",
      date: "2026-04-13",
      createdAt: "2026-04-13T10:00:00.000Z",
      source: "manual",
    });

    const { result } = renderHook(() => useUnmatchSession(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current({ profileId: "p1", matchId: "m-1" });
    });

    expect(await persistence.sessionMatch.getById("m-1")).toBeUndefined();
  });

  it("is idempotent on a missing row (resolves without throwing)", async () => {
    const { Wrapper } = wrap();
    const { result } = renderHook(() => useUnmatchSession(), {
      wrapper: Wrapper,
    });

    await expect(
      result.current({ profileId: "p1", matchId: "missing" })
    ).resolves.toBeUndefined();
  });
});
