import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useSettingsAttention } from "./use-settings-attention";

const store = vi.hoisted(() => ({ value: [] as ConnectionSource[] }));
const profile = vi.hoisted(() => ({ value: { id: "p1", profile: null } }));
const useConnectionSources = vi.hoisted(() => vi.fn(() => store.value));

vi.mock("../../../hooks/connections/use-connection-sources", () => ({
  useConnectionSources,
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => profile.value,
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

/**
 * No timezone designator, so this parses as local noon: the asserted calendar
 * day holds in every timezone the runner might be in.
 */
const LAST_SYNC_AT = new Date("2026-07-20T12:00:00").toISOString();

describe("useSettingsAttention", () => {
  it("should produce no attention while every connection is healthy", () => {
    // Arrange
    store.value = [source()];

    // Act
    const { result } = renderHook(() => useSettingsAttention());

    // Assert
    expect(result.current).toBeNull();
  });

  it("should produce the attention model from an affected source", () => {
    // Arrange
    store.value = [
      source({
        id: "whoop",
        bridgeId: "whoop-bridge",
        status: "attention",
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

  it("should read the sources of the active profile", () => {
    // Arrange
    store.value = [];
    profile.value = { id: "p1", profile: null };

    // Act
    renderHook(() => useSettingsAttention());

    // Assert
    expect(useConnectionSources).toHaveBeenCalledWith("p1");
  });
});
