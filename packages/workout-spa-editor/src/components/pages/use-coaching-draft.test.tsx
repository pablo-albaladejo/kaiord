/**
 * useCoachingDraft — seeds the workout store once from the coaching activity
 * (known sport) and marks a rest day as no-structured. Reads the shared Dexie
 * DB via useLiveQuery (fake IndexedDB, global in test-setup); the store
 * selectors are mocked so the seed call can be observed and the seed-once
 * guard exercised.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { stubActivity } from "../../application/coaching/convert-coaching-activity-with-ai.test-helpers";
import type { KRD } from "../../types/krd";
import { useCoachingDraft } from "./use-coaching-draft";

const mockLoadWorkout = vi.fn();
let mockCurrentWorkout: KRD | null = null;
vi.mock("../../store/selectors/workout-selectors", () => ({
  useLoadWorkout: () => mockLoadWorkout,
  useCurrentWorkout: () => mockCurrentWorkout,
}));

afterEach(async () => {
  await db.table("coachingActivities").clear();
  vi.clearAllMocks();
  mockCurrentWorkout = null;
});

describe("useCoachingDraft", () => {
  it("should seed the store once from a known-sport activity", async () => {
    // Arrange
    const activity = stubActivity({ sport: "cycling" });
    await db.table("coachingActivities").put(activity);

    // Act
    const { result } = renderHook(() => useCoachingDraft(activity.id));

    // Assert
    await waitFor(() => expect(result.current.activity?.id).toBe(activity.id));
    await waitFor(() => expect(mockLoadWorkout).toHaveBeenCalledTimes(1));
    const seeded = mockLoadWorkout.mock.calls[0]?.[0] as KRD;
    expect(seeded.metadata.sport).toBe("cycling");
    expect(result.current.noStructured).toBe(false);
  });

  it("should mark a rest day as no-structured and not seed the store", async () => {
    // Arrange
    const activity = stubActivity({ sport: "rest" });
    await db.table("coachingActivities").put(activity);

    // Act
    const { result } = renderHook(() => useCoachingDraft(activity.id));

    // Assert
    await waitFor(() => expect(result.current.activity?.id).toBe(activity.id));
    expect(result.current.noStructured).toBe(true);
    expect(mockLoadWorkout).not.toHaveBeenCalled();
  });

  it("should not re-seed when the store already holds a workout", async () => {
    // Arrange
    mockCurrentWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-04-01T00:00:00Z", sport: "cycling" },
    };
    const activity = stubActivity({ sport: "cycling" });
    await db.table("coachingActivities").put(activity);

    // Act
    const { result } = renderHook(() => useCoachingDraft(activity.id));

    // Assert
    await waitFor(() => expect(result.current.activity?.id).toBe(activity.id));
    expect(mockLoadWorkout).not.toHaveBeenCalled();
  });
});
