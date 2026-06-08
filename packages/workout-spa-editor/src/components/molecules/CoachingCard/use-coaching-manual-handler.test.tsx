/**
 * Tests for `useCoachingManual` — covers the manual-create happy path
 * (workout + session match persisted, navigates to editor) and the
 * re-entry guard added per CodeRabbit feedback.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AnalyticsProvider } from "../../../contexts/analytics-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CoachingActivityRecord } from "../../../types/coaching-activity-record";
import { useCoachingManual } from "./use-coaching-manual-handler";

const navigateMock = vi.fn();
const mockShowSuccess = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", navigateMock],
}));

vi.mock("../../../contexts/ToastContext", () => ({
  useToastContext: () => ({
    error: vi.fn(),
    success: mockShowSuccess,
    toast: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  }),
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
  const record: CoachingActivityRecord = {
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
  it("should persist a workout and navigate to the editor on success", async () => {
    // Arrange
    navigateMock.mockClear();
    mockShowSuccess.mockClear();
    const persistence = createInMemoryPersistence();
    await seedActivity(persistence);
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useCoachingManual(activity, "profile-1", onClose),
      { wrapper: wrap(persistence) }
    );

    // Act
    await act(async () => {
      await result.current.startManual();
    });

    // Assert
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/workout\//)
    );
  });

  it("should fire a success toast with static title before closing the dialog", async () => {
    // Arrange
    navigateMock.mockClear();
    mockShowSuccess.mockClear();
    const persistence = createInMemoryPersistence();
    await seedActivity(persistence);
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useCoachingManual(activity, "profile-1", onClose),
      { wrapper: wrap(persistence) }
    );

    // Act
    await act(async () => {
      await result.current.startManual();
    });

    // Assert
    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalledTimes(1));
    expect(mockShowSuccess).toHaveBeenCalledWith(
      "Workout matched",
      activity.title,
      { duration: 3000 }
    );
    // Toast fires BEFORE onClose so the success signal is committed
    // even though AppToastProvider lives above the dialog tree.
    const successOrder = mockShowSuccess.mock.invocationCallOrder[0];
    const onCloseOrder = onClose.mock.invocationCallOrder[0];
    expect(successOrder).toBeLessThan(onCloseOrder);
  });

  it("should no-op when activity or profileId is missing", async () => {
    // Arrange
    navigateMock.mockClear();
    const persistence = createInMemoryPersistence();
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useCoachingManual(null, "profile-1", onClose),
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
