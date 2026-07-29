import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BridgeConnectionState } from "../../../hooks/use-bridge-connections";
import { useConnectionsValue } from "./use-connections-value";

const store = vi.hoisted(() => ({ value: [] as BridgeConnectionState[] }));

vi.mock("../../../hooks/use-bridge-connections", () => ({
  useBridgeConnections: () => store.value,
}));

const connection = (
  overrides: Partial<BridgeConnectionState> = {}
): BridgeConnectionState => ({
  bridgeId: "garmin-bridge",
  discovered: false,
  sessionActive: false,
  checking: false,
  error: null,
  needsReauth: false,
  lastCheckedAt: null,
  lastSyncAt: undefined,
  ...overrides,
});

const bridges = (...discovered: boolean[]): BridgeConnectionState[] =>
  discovered.map((found, index) =>
    connection({ bridgeId: `bridge-${index}`, discovered: found })
  );

describe("useConnectionsValue", () => {
  it("should count the installed bridges against every known bridge", () => {
    // Arrange
    store.value = bridges(true, true, false, false, false);

    // Act
    const { result } = renderHook(() => useConnectionsValue());

    // Assert
    expect(result.current).toBe("2 of 5 installed");
  });

  it("should reach its own denominator when every bridge is installed", () => {
    // Arrange
    // The count reads `discovered`, so a probe-less bridge still counts and
    // the ceiling is the full set — unlike a live-session count, which
    // `tanita-bridge` would cap one short forever.
    store.value = [
      ...bridges(true, true, true, true),
      connection({ bridgeId: "tanita-bridge", discovered: true }),
    ];

    // Act
    const { result } = renderHook(() => useConnectionsValue());

    // Assert
    expect(result.current).toBe("5 of 5 installed");
  });

  it("should render no value while no bridge is known at all", () => {
    // Arrange
    store.value = [];

    // Act
    const { result } = renderHook(() => useConnectionsValue());

    // Assert
    expect(result.current).toBeUndefined();
  });
});
