/**
 * Tests for useCoachingDialog: lazy description load via the
 * `expandActivity` prop, late-fetch guarding, and handleConvert.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { CoachingActivity } from "../../../types/coaching-activity";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../../types/coaching-activity-record";
import { useCoachingDialog } from "./use-coaching-dialog";

const mockNavigate = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", mockNavigate],
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "p1",
    profile: {
      id: "p1",
      name: "Pablo",
      sportZones: {},
      linkedAccounts: [],
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    },
  }),
}));

const NOW = "2026-04-28T10:00:00.000Z";
const makeRecord = (
  overrides: Partial<CoachingActivityRecord> = {}
): CoachingActivityRecord => ({
  id: buildCoachingActivityId("p1", "train2go", "12345"),
  profileId: "p1",
  source: "train2go",
  sourceId: "12345",
  date: "2026-04-13",
  sport: "cycling",
  title: "Z2 60'",
  status: "pending",
  fetchedAt: NOW,
  ...overrides,
});

const makeActivity = (
  overrides: Partial<CoachingActivity> = {}
): CoachingActivity => ({
  id: "train2go:12345",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "x",
  status: "pending",
  ...overrides,
});

const wrap = (children: ReactNode) => {
  const persistence = createInMemoryPersistence();
  return (
    <PersistenceProvider persistence={persistence}>
      <ToastContextProvider>{children}</ToastContextProvider>
    </PersistenceProvider>
  );
};

describe("useCoachingDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should trigger expandActivity when activity has undefined description", async () => {
    // Arrange
    const expandActivity = vi.fn();
    const activity = makeActivity();

    // Act
    renderHook(() => useCoachingDialog(activity, vi.fn(), expandActivity), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      expect(expandActivity).toHaveBeenCalledWith(activity);
    });
  });

  it.each([
    { scenario: "activity is null", activity: null },
    {
      scenario: "description is already populated",
      activity: makeActivity({ description: "Already there" }),
    },
    {
      scenario: "description is known-empty ('')",
      activity: makeActivity({ description: "" }),
    },
  ])("should not trigger expandActivity when $scenario", ({ activity }) => {
    // Arrange
    const expandActivity = vi.fn();

    // Act
    renderHook(() => useCoachingDialog(activity, vi.fn(), expandActivity), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    expect(expandActivity).not.toHaveBeenCalled();
  });

  it("should ignore a late failure from a previously-open activity's fetch", async () => {
    // Arrange
    let resolveA!: (r: { ok: false; reason: "transport-error" }) => void;
    const pendingA = new Promise<{ ok: false; reason: "transport-error" }>(
      (res) => {
        resolveA = res;
      }
    );
    const expandActivity = vi
      .fn()
      .mockReturnValueOnce(pendingA)
      .mockResolvedValue({ ok: true, activityCount: 1 });
    const activityA = makeActivity({ id: "train2go:A", title: "A" });
    const activityB = makeActivity({ id: "train2go:B", title: "B" });

    // Act
    const { result, rerender } = renderHook(
      ({ activity }) => useCoachingDialog(activity, vi.fn(), expandActivity),
      {
        wrapper: ({ children }) => wrap(children),
        initialProps: { activity: activityA },
      }
    );
    rerender({ activity: activityB });
    await act(async () => {
      resolveA({ ok: false, reason: "transport-error" });
    });

    // Assert
    expect(result.current.descriptionLoad.reason).toBeNull();
  });

  it("should surface 'Activity not found' via handleConvert when record is missing in repo", async () => {
    // Arrange
    const onClose = vi.fn();
    const activity = makeActivity({ id: "train2go:99999", description: "x" });
    const persistence = createInMemoryPersistence();
    const { result } = renderHook(
      () => useCoachingDialog(activity, onClose, vi.fn()),
      {
        wrapper: ({ children }) => (
          <PersistenceProvider persistence={persistence}>
            <ToastContextProvider>{children}</ToastContextProvider>
          </PersistenceProvider>
        ),
      }
    );

    // Act
    await result.current.handleConvert();

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBe("Activity not found");
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should navigate to /workout/:id on successful conversion via handleConvert", async () => {
    // Arrange
    const onClose = vi.fn();
    const activity = makeActivity({ description: "x" });
    const persistence = createInMemoryPersistence();
    await persistence.coaching.put(makeRecord());
    const { result } = renderHook(
      () => useCoachingDialog(activity, onClose, vi.fn()),
      {
        wrapper: ({ children }) => (
          <PersistenceProvider persistence={persistence}>
            <ToastContextProvider>{children}</ToastContextProvider>
          </PersistenceProvider>
        ),
      }
    );

    // Act
    await result.current.handleConvert();

    // Assert
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/^\/workout\//)
      );
    });
  });
});
