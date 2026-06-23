/**
 * Tests for `useCoachingManual` (defer-coaching-create): "Edit manually"
 * no longer persists on click — it navigates to a store-only draft editor
 * (`/workout/new?coaching=`) and persistence happens only on Save. If a
 * workout already exists for the activity it opens that instead (idempotency).
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AnalyticsProvider } from "../../../contexts/analytics-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CoachingActivityRecord } from "../../../types/coaching-activity-record";
import { namespaceSourceId } from "../../../types/coaching-activity-record";
import { useCoachingManual } from "./use-coaching-manual-handler";

const navigateMock = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", navigateMock],
}));

const activity: CoachingActivity = {
  id: "train2go:abc",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "Sweet spot",
  duration: "01:00:00",
  effort: 4,
  status: "pending",
  description: "Coach description here",
};

const seedActivity = async (
  persistence: ReturnType<typeof createInMemoryPersistence>
) => {
  const record = {
    id: `profile-1:${activity.id}`,
    profileId: "profile-1",
    source: "train2go",
    sourceId: "abc",
    date: activity.date,
    title: activity.title,
    duration: activity.duration,
    effort: activity.effort,
    status: "pending",
    sport: "cycling",
    description: activity.description ?? null,
    raw: null,
    createdAt: "2026-04-13T08:00:00Z",
    updatedAt: "2026-04-13T08:00:00Z",
  } as unknown as CoachingActivityRecord;
  await persistence.coaching.put(record);
};

const wrap = (
  persistence: ReturnType<typeof createInMemoryPersistence>
): ((props: { children: ReactNode }) => ReactNode) => {
  return ({ children }) => (
    <AnalyticsProvider analytics={{ event: vi.fn() }}>
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    </AnalyticsProvider>
  );
};

describe("useCoachingManual", () => {
  it("should navigate to the draft route without persisting when no workout exists", async () => {
    // Arrange
    navigateMock.mockClear();
    const persistence = createInMemoryPersistence();
    await seedActivity(persistence);
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useCoachingManual(activity, "profile-1", onClose, vi.fn()),
      { wrapper: wrap(persistence) }
    );

    // Act
    await act(async () => {
      await result.current.startManual();
    });

    // Assert
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    // The composite id is percent-encoded in the URL (decoded on read).
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/workout/new?coaching=")
    );
    const persisted = await persistence.workouts.getByDateRange(
      activity.date,
      activity.date
    );
    expect(persisted).toHaveLength(0);
  });

  it("should open the existing workout instead of a fresh draft", async () => {
    // Arrange
    navigateMock.mockClear();
    const persistence = createInMemoryPersistence();
    await seedActivity(persistence);
    const ns = namespaceSourceId("profile-1", "abc");
    await persistence.workouts.put({
      id: "w-existing",
      source: "train2go",
      sourceId: ns,
      date: activity.date,
      state: "structured",
    } as unknown as WorkoutRecord);
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useCoachingManual(activity, "profile-1", onClose, vi.fn()),
      { wrapper: wrap(persistence) }
    );

    // Act
    await act(async () => {
      await result.current.startManual();
    });

    // Assert
    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/workout/w-existing")
    );
    expect(navigateMock).not.toHaveBeenCalledWith(
      expect.stringContaining("new?coaching")
    );
  });

  it("should prefetch the description before navigating when not yet loaded", async () => {
    // Arrange
    navigateMock.mockClear();
    const persistence = createInMemoryPersistence();
    await seedActivity(persistence);
    const unloaded: CoachingActivity = { ...activity, description: undefined };
    const expandActivity = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useCoachingManual(unloaded, "profile-1", vi.fn(), expandActivity),
      { wrapper: wrap(persistence) }
    );

    // Act
    await act(async () => {
      await result.current.startManual();
    });

    // Assert
    expect(expandActivity).toHaveBeenCalledWith(unloaded);
    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
  });

  it("should not prefetch when the description is already loaded", async () => {
    // Arrange
    navigateMock.mockClear();
    const persistence = createInMemoryPersistence();
    await seedActivity(persistence);
    const expandActivity = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useCoachingManual(activity, "profile-1", vi.fn(), expandActivity),
      { wrapper: wrap(persistence) }
    );

    // Act
    await act(async () => {
      await result.current.startManual();
    });

    // Assert
    expect(expandActivity).not.toHaveBeenCalled();
  });

  it("should no-op when activity or profileId is missing", async () => {
    // Arrange
    navigateMock.mockClear();
    const persistence = createInMemoryPersistence();
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useCoachingManual(null, "profile-1", onClose, vi.fn()),
      { wrapper: wrap(persistence) }
    );

    // Act
    await act(async () => {
      await result.current.startManual();
    });

    // Assert
    expect(onClose).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
