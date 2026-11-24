import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useHeaderAttention } from "./use-header-attention";

const store = vi.hoisted(() => ({ value: [] as ConnectionSource[] }));

vi.mock("../../../hooks/connections/use-connection-sources", () => ({
  useConnectionSources: () => store.value,
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p1", profile: null }),
}));

const source = (
  overrides: Partial<ConnectionSource> = {}
): ConnectionSource => ({
  id: "garmin",
  name: "Garmin",
  mark: "G",
  mechanism: "bridge",
  bridgeId: "garmin-bridge",
  status: "connected",
  bridgeDetected: true,
  disconnected: false,
  connection: "working",
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
  ...overrides,
});

describe("useHeaderAttention", () => {
  it("should stay null while every source is healthy", () => {
    // Arrange
    // Reachable state: `bridgeSourceStatus` returns `connected` for a probed
    // bridge with a live session, which is the ordinary case.
    store.value = [source()];

    // Act
    const { result } = renderHook(() => useHeaderAttention());

    // Assert
    expect(result.current).toBeNull();
  });

  it("should word one affected source in the singular", async () => {
    // Arrange
    // Reachable state: WHOOP installed, its check could not tell why it failed.
    store.value = [
      source({
        id: "whoop",
        name: "WHOOP",
        status: "attention",
        connection: "not-answering",
      }),
    ];

    // Act
    const { result } = renderHook(() => useHeaderAttention());

    // Assert
    await waitFor(() =>
      expect(result.current).toEqual({
        count: 1,
        title: "1 source down",
        detail:
          "WHOOP is not answering, so you cannot use it in Kaiord right now.",
      })
    );
  });

  it("should word several affected sources in the plural", () => {
    // Arrange
    store.value = [
      source({ status: "attention" }),
      source({ id: "whoop", status: "attention" }),
    ];

    // Act
    const { result } = renderHook(() => useHeaderAttention());

    // Assert
    expect(result.current?.title).toBe("2 sources down");
  });

  it("should share its verdict with the Settings banner", async () => {
    // Arrange
    // Both surfaces read `useConnectionAttention`; only the wording differs.
    // A source the header calls down is one Settings calls needing
    // attention, never one it calls healthy.
    store.value = [
      source({
        id: "trainingpeaks",
        name: "TrainingPeaks",
        status: "attention",
        connection: "signed-out",
      }),
    ];

    // Act
    const { result } = renderHook(() => useHeaderAttention());

    // Assert
    await waitFor(() =>
      expect(result.current?.detail).toBe(
        "You cannot use TrainingPeaks in Kaiord until you sign in to TrainingPeaks in this browser."
      )
    );
  });

  it("should show the count and the title before the notices have loaded", () => {
    // Arrange
    // The shared notices load once a source needs attention; until they
    // have, the pill is already there with its count and its title.
    store.value = [source({ status: "attention", connection: "signed-out" })];

    // Act
    const { result } = renderHook(() => useHeaderAttention());

    // Assert
    expect(result.current?.title).toBe("1 source down");
  });
});
