import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CoachingSource,
  CoachingSourceFactory,
} from "../types/coaching-source";

const ACTIVE_PROFILE_ID = "p1";

const fakeSource: CoachingSource = {
  id: "train2go",
  label: "Train2Go",
  badge: "T2G",
  available: true,
  connected: true,
  loading: false,
  error: null,
  activities: [
    {
      id: "train2go:1",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-13",
      sport: { label: "Running", icon: "running" },
      title: "Easy Run",
      status: "pending",
    },
    {
      id: "train2go:2",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-14",
      sport: { label: "Cycling", icon: "cycling" },
      title: "Long Ride",
      status: "completed",
    },
  ],
  sync: vi.fn(async () => undefined),
  expand: vi.fn(async () => undefined),
  connect: vi.fn(async () => undefined),
};

const factory: CoachingSourceFactory = vi.fn(() => fakeSource);

vi.mock("../contexts/coaching-registry-context", () => ({
  useCoachingSourceFactories: () => [factory],
}));

vi.mock("./use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: ACTIVE_PROFILE_ID, profile: null }),
}));

import { useCoachingActivities } from "./use-coaching-activities";

describe("useCoachingActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should invoke each factory with (activeProfileId, days)", () => {
    // Arrange
    const days = ["2026-04-13", "2026-04-14"];

    // Act
    renderHook(() => useCoachingActivities(days));

    // Assert
    expect(factory).toHaveBeenCalledWith(ACTIVE_PROFILE_ID, days);
  });

  it("should group activities by day", () => {
    // Arrange

    // Act
    const { result } = renderHook(() =>
      useCoachingActivities(["2026-04-13", "2026-04-14", "2026-04-15"])
    );

    // Assert
    expect(result.current.byDay["2026-04-13"]).toHaveLength(1);
    expect(result.current.byDay["2026-04-14"]).toHaveLength(1);
    expect(result.current.byDay["2026-04-15"]).toHaveLength(0);
  });

  it("should return syncSources for available sources", () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useCoachingActivities(["2026-04-13"]));

    // Assert
    expect(result.current.syncSources).toHaveLength(1);
    expect(result.current.syncSources[0]?.id).toBe("train2go");
    expect(result.current.syncSources[0]?.connected).toBe(true);
  });

  it("should call source.expand with (activeProfileId, date) via expandActivity", async () => {
    // Arrange
    const { result } = renderHook(() => useCoachingActivities(["2026-04-13"]));

    // Act
    result.current.expandActivity({
      id: "train2go:1",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-13",
      sport: { label: "Running", icon: "running" },
      title: "Easy Run",
      status: "pending",
    });

    // Assert
    expect(fakeSource.expand).toHaveBeenCalledWith(
      ACTIVE_PROFILE_ID,
      "2026-04-13"
    );
  });

  it("should do nothing for unknown source via expandActivity", () => {
    // Arrange
    const { result } = renderHook(() => useCoachingActivities(["2026-04-13"]));

    // Act
    result.current.expandActivity({
      id: "unknown:1",
      source: "unknown",
      sourceBadge: "?",
      date: "2026-04-13",
      sport: { label: "Running", icon: "running" },
      title: "Run",
      status: "pending",
    });

    // Assert
    expect(fakeSource.expand).not.toHaveBeenCalled();
  });

  it("should inject activeProfileId before calling source.sync", async () => {
    // Arrange
    const { result } = renderHook(() => useCoachingActivities(["2026-04-13"]));
    const source = result.current.syncSources[0]!;

    // Act
    await source.sync("2026-04-13");

    // Assert
    expect(fakeSource.sync).toHaveBeenCalledWith(
      ACTIVE_PROFILE_ID,
      "2026-04-13"
    );
  });

  it("should inject activeProfileId before calling source.connect", async () => {
    // Arrange
    const { result } = renderHook(() => useCoachingActivities(["2026-04-13"]));
    const source = result.current.syncSources[0]!;

    // Act
    await source.connect();

    // Assert
    expect(fakeSource.connect).toHaveBeenCalledWith(ACTIVE_PROFILE_ID);
  });
});
