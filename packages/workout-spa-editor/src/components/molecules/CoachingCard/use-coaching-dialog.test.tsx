import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../../types/coaching-activity-record";

const mockNavigate = vi.fn();
const mockExpand = vi.fn(async () => undefined);

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", mockNavigate],
}));

vi.mock("../../../contexts/coaching-registry-context", () => ({
  useCoachingSourceFactories: () => [
    () => ({
      id: "train2go",
      label: "Train2Go",
      badge: "T2G",
      available: true,
      connected: true,
      loading: false,
      error: null,
      activities: [],
      sync: vi.fn(async () => undefined),
      expand: mockExpand,
      connect: vi.fn(async () => undefined),
    }),
  ],
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

import { useCoachingDialog } from "./use-coaching-dialog";

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

  it("does nothing when activity is null", () => {
    const { result } = renderHook(() => useCoachingDialog(null, vi.fn()), {
      wrapper: ({ children }) => wrap(children),
    });

    expect(result.current.error).toBeNull();
    expect(result.current.converting).toBe(false);
  });

  it("triggers source.expand when activity has undefined description", async () => {
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

    renderHook(() => useCoachingDialog(activity, vi.fn()), {
      wrapper: ({ children }) => wrap(children),
    });

    await waitFor(() => {
      expect(mockExpand).toHaveBeenCalledWith("p1", "2026-04-13");
    });
  });

  it("does NOT trigger expand when description is already populated", () => {
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

    renderHook(() => useCoachingDialog(activity, vi.fn()), {
      wrapper: ({ children }) => wrap(children),
    });

    expect(mockExpand).not.toHaveBeenCalled();
  });

  it("does NOT trigger expand when description is known-empty ('')", () => {
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

    renderHook(() => useCoachingDialog(activity, vi.fn()), {
      wrapper: ({ children }) => wrap(children),
    });

    expect(mockExpand).not.toHaveBeenCalled();
  });

  it("handleConvert: surfaces 'Activity not found' when record missing in repo", async () => {
    const onClose = vi.fn();
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

    const { result } = renderHook(() => useCoachingDialog(activity, onClose), {
      wrapper: ({ children }) => (
        <PersistenceProvider persistence={persistence}>
          {children}
        </PersistenceProvider>
      ),
    });

    await result.current.handleConvert();

    await waitFor(() => {
      expect(result.current.error).toBe("Activity not found");
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("handleConvert: navigates to /workout/:id on successful conversion", async () => {
    const onClose = vi.fn();
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

    const { result } = renderHook(() => useCoachingDialog(activity, onClose), {
      wrapper: ({ children }) => (
        <PersistenceProvider persistence={persistence}>
          {children}
        </PersistenceProvider>
      ),
    });

    await result.current.handleConvert();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/^\/workout\//)
      );
    });
  });
});
