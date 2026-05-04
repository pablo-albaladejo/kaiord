/**
 * Tests for useCoachingDialog. The 6 cases (preserved from the
 * pre-fix file, never delete a test):
 *   1. does nothing when activity is null
 *   2. triggers expandActivity when description is undefined
 *   3. does NOT trigger expandActivity when description is populated
 *   4. does NOT trigger expandActivity when description is known-empty ("")
 *   5. handleConvert: surfaces "Activity not found" on missing repo record
 *   6. handleConvert: navigates to /workout/:id on success
 *
 * Cases 2/3/4 changed semantics post-fix: they assert the
 * `expandActivity` callback prop is invoked (or not), not the
 * registry-mocked source.expand. Cases 1/5/6 are unchanged in intent;
 * they pass an `expandActivity={vi.fn()}` to compile.
 */
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
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

const wrap = (children: ReactNode) => {
  const persistence = createInMemoryPersistence();
  return (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
};

describe("useCoachingDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do nothing when activity is null", () => {
    // Arrange

    const expandActivity = vi.fn();

    // Act

    const { result } = renderHook(
      () => useCoachingDialog(null, vi.fn(), expandActivity),
      { wrapper: ({ children }) => wrap(children) }
    );

    // Assert

    expect(result.current.error).toBeNull();
    expect(result.current.converting).toBe(false);
    expect(expandActivity).not.toHaveBeenCalled();
  });

  it("should trigger expandActivity when activity has undefined description", async () => {
    // Arrange

    const expandActivity = vi.fn();
    const activity = {
      id: "train2go:12345",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-13",
      sport: { label: "Cycling", icon: "🚴" },
      title: "x",
      status: "pending" as const,
      // description: undefined
    };

    // Act

    renderHook(() => useCoachingDialog(activity, vi.fn(), expandActivity), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert

    await waitFor(() => {
      expect(expandActivity).toHaveBeenCalledWith(activity);
    });
  });

  it("should do NOT trigger expandActivity when description is already populated", () => {
    // Arrange

    const expandActivity = vi.fn();
    const activity = {
      id: "train2go:12345",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-13",
      sport: { label: "Cycling", icon: "🚴" },
      title: "x",
      status: "pending" as const,
      description: "Already there",
    };

    // Act

    renderHook(() => useCoachingDialog(activity, vi.fn(), expandActivity), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert

    expect(expandActivity).not.toHaveBeenCalled();
  });

  it("does NOT trigger expandActivity when description is known-empty ('')", () => {
    // Arrange

    const expandActivity = vi.fn();
    const activity = {
      id: "train2go:12345",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-13",
      sport: { label: "Cycling", icon: "🚴" },
      title: "x",
      status: "pending" as const,
      description: "",
    };

    // Act

    renderHook(() => useCoachingDialog(activity, vi.fn(), expandActivity), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert

    expect(expandActivity).not.toHaveBeenCalled();
  });

  it("handleConvert: surfaces 'Activity not found' when record missing in repo", async () => {
    // Arrange

    const onClose = vi.fn();
    const expandActivity = vi.fn();
    const activity = {
      id: "train2go:99999",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-13",
      sport: { label: "Cycling", icon: "🚴" },
      title: "x",
      status: "pending" as const,
      description: "x",
    };
    const persistence = createInMemoryPersistence();

    const { result } = renderHook(
      () => useCoachingDialog(activity, onClose, expandActivity),
      {
        wrapper: ({ children }) => (
          <PersistenceProvider persistence={persistence}>
            {children}
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
    const expandActivity = vi.fn();
    const activity = {
      id: "train2go:12345",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-13",
      sport: { label: "Cycling", icon: "🚴" },
      title: "x",
      status: "pending" as const,
      description: "x",
    };
    const persistence = createInMemoryPersistence();
    await persistence.coaching.put(makeRecord());

    const { result } = renderHook(
      () => useCoachingDialog(activity, onClose, expandActivity),
      {
        wrapper: ({ children }) => (
          <PersistenceProvider persistence={persistence}>
            {children}
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
