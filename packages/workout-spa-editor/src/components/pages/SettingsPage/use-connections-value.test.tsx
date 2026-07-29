import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DISCOVERY_SETTLE_MS } from "../../../hooks/connections/use-discovery-settled";
import { resetDiscoveryClock } from "../../../hooks/discovery-clock";
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
  outdated: false,
  lastCheckedAt: null,
  lastSyncAt: undefined,
  ...overrides,
});

const bridges = (...discovered: boolean[]): BridgeConnectionState[] =>
  discovered.map((found, index) =>
    connection({ bridgeId: `bridge-${index}`, discovered: found })
  );

/** Discovery started long enough ago that its window has closed. */
const discoverySettled = () =>
  resetDiscoveryClock(Date.now() - DISCOVERY_SETTLE_MS);

/** Discovery started just now: nothing can have announced yet. */
const discoveryJustStarted = () => resetDiscoveryClock(Date.now());

describe("useConnectionsValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetDiscoveryClock();
  });

  it("should count the detected bridges against every known bridge", () => {
    // Arrange
    discoverySettled();
    store.value = bridges(true, true, false, false, false);

    // Act
    const { result } = renderHook(() => useConnectionsValue());

    // Assert
    expect(result.current).toBe("2 of 5 detected");
  });

  it("should reach its own denominator when every bridge answers", () => {
    // Arrange
    // The count reads `discovered`, so a probe-less bridge still counts and
    // the ceiling is the full set — unlike a live-session count, which
    // `tanita-bridge` would cap one short forever.
    discoverySettled();
    store.value = [
      ...bridges(true, true, true, true),
      connection({ bridgeId: "tanita-bridge", discovered: true }),
    ];

    // Act
    const { result } = renderHook(() => useConnectionsValue());

    // Assert
    expect(result.current).toBe("5 of 5 detected");
  });

  it("should render no value while discovery is still in its opening window", () => {
    // Arrange
    // The reachable failure: a hard reload with five extensions installed.
    // Discovery only installs a listener and arms a timer, so every row reads
    // undiscovered — while the store's first pass finishes microseconds later
    // and would otherwise unlock a confident "0 of 5" on screen for seconds.
    discoveryJustStarted();
    store.value = bridges(false, false, false, false, false);

    // Act
    const { result } = renderHook(() => useConnectionsValue());

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should state the honest zero once discovery's window has closed", () => {
    // Arrange
    // The other reachable failure, and the reason the gate cannot simply wait
    // for a detection: a reader with no extensions installed must eventually
    // be told so rather than left on a placeholder forever.
    discoveryJustStarted();
    store.value = bridges(false, false, false, false, false);
    const { result } = renderHook(() => useConnectionsValue());

    // Act
    act(() => {
      vi.advanceTimersByTime(DISCOVERY_SETTLE_MS);
    });

    // Assert
    expect(result.current).toBe("0 of 5 detected");
  });

  it("should answer as soon as a bridge is detected, without waiting out the window", () => {
    // Arrange
    // A detection is positive evidence that announcements are arriving, so
    // making an equipped reader stare at a blank row for the full window
    // would withhold an answer already known.
    discoveryJustStarted();
    store.value = bridges(true, false, false, false, false);

    // Act
    const { result } = renderHook(() => useConnectionsValue());

    // Assert
    expect(result.current).toBe("1 of 5 detected");
  });
});
