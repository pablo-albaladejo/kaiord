import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingSource } from "../types/coaching-source";

const mockSources: CoachingSource[] = [
  {
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
    sync: vi.fn(),
    expand: vi.fn(),
    connect: vi.fn(),
  },
];

vi.mock("../contexts/coaching-registry-context", () => ({
  useCoachingSources: () => mockSources,
}));

import { useCoachingActivities } from "./use-coaching-activities";

describe("useCoachingActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("groups activities by day", () => {
    const { result } = renderHook(() =>
      useCoachingActivities(["2026-04-13", "2026-04-14", "2026-04-15"])
    );

    expect(result.current.byDay["2026-04-13"]).toHaveLength(1);
    expect(result.current.byDay["2026-04-14"]).toHaveLength(1);
    expect(result.current.byDay["2026-04-15"]).toHaveLength(0);
  });

  it("returns syncSources for available sources", () => {
    const { result } = renderHook(() => useCoachingActivities(["2026-04-13"]));

    expect(result.current.syncSources).toHaveLength(1);
    expect(result.current.syncSources[0].id).toBe("train2go");
    expect(result.current.syncSources[0].connected).toBe(true);
  });

  it("expandActivity calls source.expand with activity date", () => {
    const { result } = renderHook(() => useCoachingActivities(["2026-04-13"]));

    result.current.expandActivity({
      id: "train2go:1",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-13",
      sport: { label: "Running", icon: "running" },
      title: "Easy Run",
      status: "pending",
    });

    expect(mockSources[0].expand).toHaveBeenCalledWith("2026-04-13");
  });

  it("expandActivity does nothing for unknown source", () => {
    const { result } = renderHook(() => useCoachingActivities(["2026-04-13"]));

    result.current.expandActivity({
      id: "unknown:1",
      source: "unknown",
      sourceBadge: "?",
      date: "2026-04-13",
      sport: { label: "Running", icon: "running" },
      title: "Run",
      status: "pending",
    });

    expect(mockSources[0].expand).not.toHaveBeenCalled();
  });

  it("syncSources includes sync and connect callbacks", () => {
    const { result } = renderHook(() => useCoachingActivities(["2026-04-13"]));

    const source = result.current.syncSources[0];
    source.sync("2026-04-13");
    source.connect();

    expect(mockSources[0].sync).toHaveBeenCalledWith("2026-04-13");
    expect(mockSources[0].connect).toHaveBeenCalled();
  });
});
