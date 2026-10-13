import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "../../../application/connections/connection-source";
import { DISCOVERY_SETTLE_MS } from "../../../hooks/connections/use-discovery-settled";
import { resetDiscoveryClock } from "../../../hooks/discovery-clock";
import { useConnectionsValue } from "./use-connections-value";

const source = (
  id: string,
  status: ConnectionSourceStatus,
  mechanism: ConnectionSource["mechanism"] = "bridge"
): ConnectionSource => ({
  id,
  name: id,
  mark: id.slice(0, 1),
  mechanism,
  bridgeId: mechanism === "bridge" ? `${id}-bridge` : null,
  status,
  bridgeDetected: status !== "available",
  disconnected: false,
  needsReauth: false,
  outdated: false,
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
});

/** The seven cards the page renders, plus the brands it cannot connect. */
const page = (
  overrides: Record<string, ConnectionSourceStatus> = {}
): ConnectionSource[] => [
  source("garmin", overrides.garmin ?? "available"),
  source("whoop", overrides.whoop ?? "available"),
  source("train2go", overrides.train2go ?? "available"),
  source("tanita", overrides.tanita ?? "available"),
  source("trainingpeaks", overrides.trainingpeaks ?? "available"),
  source("intervals", overrides.intervals ?? "available", "api-key"),
  source("manual", "manual", "manual"),
  source("strava", "unsupported", "not-supported"),
];

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

  // P-09: the old value counted only the five extensions ("0 of 5 detected")
  // beside a page of seven cards. intervals.icu is connected by API key, so a
  // count of extensions could never include it.
  it("should count every connected source, the API-key ones included", () => {
    // Arrange
    discoverySettled();
    const sources = page({ garmin: "connected", intervals: "connected" });

    // Act
    const { result } = renderHook(() => useConnectionsValue(sources));

    // Assert
    expect(result.current).toBe("2 connected");
  });

  it("should count a connected source that needs attention or is still checking", () => {
    // Arrange
    // Still linked: what it needs is a fix, not a connect.
    discoverySettled();
    const sources = page({
      whoop: "attention",
      tanita: "installed",
      train2go: "checking",
    });

    // Act
    const { result } = renderHook(() => useConnectionsValue(sources));

    // Assert
    expect(result.current).toBe("3 connected");
  });

  it("should never count manual entry or a brand that cannot be connected", () => {
    // Arrange
    discoverySettled();

    // Act
    const { result } = renderHook(() => useConnectionsValue(page()));

    // Assert
    expect(result.current).toBe("None connected");
  });

  it("should use the singular for one connection", () => {
    // Arrange
    discoverySettled();

    // Act
    const { result } = renderHook(() =>
      useConnectionsValue(page({ garmin: "connected" }))
    );

    // Assert
    expect(result.current).toBe("1 connected");
  });

  it("should render no value while discovery is still in its opening window", () => {
    // Arrange
    // A hard reload with extensions installed: every bridge reads available
    // until it announces, so a confident "None connected" would be a lie.
    discoveryJustStarted();

    // Act
    const { result } = renderHook(() => useConnectionsValue(page()));

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should state the honest zero once discovery's window has closed", () => {
    // Arrange
    discoveryJustStarted();
    const sources = page();
    const { result } = renderHook(() => useConnectionsValue(sources));

    // Act
    act(() => {
      vi.advanceTimersByTime(DISCOVERY_SETTLE_MS);
    });

    // Assert
    expect(result.current).toBe("None connected");
  });

  it("should answer as soon as a source is connected, without waiting out the window", () => {
    // Arrange
    discoveryJustStarted();

    // Act
    const { result } = renderHook(() =>
      useConnectionsValue(page({ garmin: "connected" }))
    );

    // Assert
    expect(result.current).toBe("1 connected");
  });
});
