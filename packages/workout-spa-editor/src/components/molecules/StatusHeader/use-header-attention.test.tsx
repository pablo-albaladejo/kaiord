import { renderHook } from "@testing-library/react";
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
  needsReauth: false,
  outdated: false,
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

  it("should word one affected source in the singular", () => {
    // Arrange
    // Reachable state: WHOOP installed, read did not come back —
    // `probeWhoopSession`
    // writes `inactive()`, which `bridgeSourceStatus` reads as attention.
    store.value = [source({ id: "whoop", status: "attention" })];

    // Act
    const { result } = renderHook(() => useHeaderAttention());

    // Assert
    expect(result.current).toEqual({
      title: "1 source down",
      detail: "Kaiord cannot read from a source — signing in again may restore it",
    });
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

  it("should share its verdict with the Settings banner", () => {
    // Arrange
    // Both surfaces read `useConnectionAttention`; only the wording differs.
    // A source the header calls down is one Settings calls needing
    // attention, never one it calls healthy.
    store.value = [
      source({ id: "trainingpeaks", status: "attention", needsReauth: true }),
    ];

    // Act
    const { result } = renderHook(() => useHeaderAttention());

    // Assert
    expect(result.current?.detail).toBe(
      "Kaiord cannot read from a source — signing in again may restore it"
    );
  });
});
