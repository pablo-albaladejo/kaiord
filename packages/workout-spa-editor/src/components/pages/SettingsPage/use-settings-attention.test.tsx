import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BridgeConnectionState } from "../../../hooks/use-bridge-connections";
import { useSettingsAttention } from "./use-settings-attention";

const store = vi.hoisted(() => ({ value: [] as BridgeConnectionState[] }));
const profile = vi.hoisted(() => ({ value: { id: "p1", profile: null } }));
const useBridgeConnections = vi.hoisted(() => vi.fn(() => store.value));

vi.mock("../../../hooks/use-bridge-connections", () => ({
  useBridgeConnections,
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => profile.value,
}));

const connection = (
  overrides: Partial<BridgeConnectionState> = {}
): BridgeConnectionState => ({
  bridgeId: "garmin-bridge",
  discovered: true,
  sessionActive: true,
  checking: false,
  error: null,
  needsReauth: false,
  outdated: false,
  lastCheckedAt: 1_700_000_000_000,
  lastSyncAt: undefined,
  ...overrides,
});

/**
 * No timezone designator, so this parses as local noon: the asserted calendar
 * day holds in every timezone the runner might be in.
 */
const LAST_SYNC_AT = new Date("2026-07-20T12:00:00").toISOString();

describe("useSettingsAttention", () => {
  it("should produce no attention while every connection is healthy", () => {
    // Arrange
    store.value = [connection()];

    // Act
    const { result } = renderHook(() => useSettingsAttention());

    // Assert
    expect(result.current).toBeNull();
  });

  it("should produce the attention model from a failed connection", () => {
    // Arrange
    store.value = [
      connection({
        bridgeId: "whoop-bridge",
        error: "unreachable",
        sessionActive: false,
        lastSyncAt: LAST_SYNC_AT,
      }),
    ];

    // Act
    const { result } = renderHook(() => useSettingsAttention());

    // Assert
    expect(result.current).toEqual({
      title: "1 connection needs attention",
      detail: "No new data since 2026-07-20",
    });
  });

  it("should read the connections of the active profile", () => {
    // Arrange
    store.value = [];
    profile.value = { id: "p1", profile: null };

    // Act
    renderHook(() => useSettingsAttention());

    // Assert
    expect(useBridgeConnections).toHaveBeenCalledWith("p1");
  });
});
