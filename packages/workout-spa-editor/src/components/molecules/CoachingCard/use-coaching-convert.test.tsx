/**
 * useCoachingConvert — direct hook tests.
 *
 * Co-located with the production code. The parent hook (useCoachingDialog) is
 * tested separately; these tests pin the child contract: on success it calls
 * navigate(`/workout/<id>`) and onClose() exactly once; on failure it sets
 * `error` and does NOT navigate or close.
 */

import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", navigate],
}));

import { AnalyticsProvider } from "../../../contexts/analytics-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import type { PersistencePort } from "../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { CoachingActivity } from "../../../types/coaching-activity";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../../types/coaching-activity-record";
import { useCoachingConvert } from "./use-coaching-convert";

const NOW = "2026-04-28T10:00:00.000Z";

const makeActivity = (): CoachingActivity => ({
  id: "train2go:12345",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "FTP test",
  status: "pending",
  description: "x",
});

const makeRecord = (): CoachingActivityRecord => ({
  id: buildCoachingActivityId("p1", "train2go", "12345"),
  profileId: "p1",
  source: "train2go",
  sourceId: "12345",
  date: "2026-04-13",
  sport: "cycling",
  title: "FTP test",
  status: "pending",
  fetchedAt: NOW,
});

const wrap = (persistence: PersistencePort) => {
  const analytics = { event: vi.fn() };
  return ({ children }: { children: ReactNode }) => (
    <AnalyticsProvider analytics={analytics}>
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    </AnalyticsProvider>
  );
};

describe("useCoachingConvert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls navigate('/workout/<workoutId>') and onClose() exactly once on success", async () => {
    const onClose = vi.fn();
    const persistence = createInMemoryPersistence();
    await persistence.coaching.put(makeRecord());

    const { result } = renderHook(
      () => useCoachingConvert(makeActivity(), "p1", onClose),
      { wrapper: wrap(persistence) }
    );

    await result.current.handleConvert();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      expect.stringMatching(/^\/workout\/.+/)
    );
    expect(result.current.error).toBeNull();
  });

  it("sets error and does NOT navigate or close on convertCoachingActivity rejection", async () => {
    const onClose = vi.fn();
    const persistence = createInMemoryPersistence();
    await persistence.coaching.put(makeRecord());
    // Force convertCoachingActivity to reject by making workouts.put throw.
    persistence.workouts.put = async () => {
      throw new Error("quota exceeded");
    };

    const { result } = renderHook(
      () => useCoachingConvert(makeActivity(), "p1", onClose),
      { wrapper: wrap(persistence) }
    );

    await result.current.handleConvert();

    await waitFor(() => {
      expect(result.current.error).toBe("quota exceeded");
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
