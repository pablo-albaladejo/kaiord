import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBridgeDiscovery } from "./bridge-discovery";
import type { BridgeAnnouncement } from "./bridge-discovery-types";

const DISCOVERY_INTERVAL_TICK_MS = 3_000;

const ANNOUNCE_GARMIN: BridgeAnnouncement = {
  type: "KAIORD_BRIDGE_ANNOUNCE",
  bridgeId: "garmin-bridge",
  extensionId: "garmin-ext-id",
  name: "Garmin",
  version: "0.2.0",
  protocolVersion: 1,
  capabilities: ["write:workouts"],
};

const ANNOUNCE_TRAIN2GO: BridgeAnnouncement = {
  type: "KAIORD_BRIDGE_ANNOUNCE",
  bridgeId: "train2go-bridge",
  extensionId: "train2go-ext-id",
  name: "Train2Go",
  version: "0.1.1",
  protocolVersion: 1,
  capabilities: ["read:training-plan"],
};

function emit(data: unknown): void {
  window.dispatchEvent(new MessageEvent("message", { data, source: window }));
}

describe("createBridgeDiscovery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should register extension id after a verified announcement", async () => {
    // Arrange
    const verify = vi.fn().mockResolvedValue({
      id: "x",
      name: "x",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: [],
    });
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();
    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();
    expect(verify).toHaveBeenCalledWith(ANNOUNCE_GARMIN);
    expect(discovery.getExtensionId("garmin-bridge")).toBe("garmin-ext-id");

    // Act
    discovery.stop();

    // Assert
  });

  it("should reject announcements that fail verification (spoof)", async () => {
    // Arrange
    const verify = vi.fn().mockResolvedValue(null);
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();
    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();
    expect(discovery.getExtensionId("garmin-bridge")).toBeNull();

    // Act
    discovery.stop();

    // Assert
  });

  it("should register multiple bridges independently", async () => {
    // Arrange
    const verify = vi.fn().mockResolvedValue({
      id: "x",
      name: "x",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: [],
    });
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();
    emit(ANNOUNCE_GARMIN);
    emit(ANNOUNCE_TRAIN2GO);
    await vi.runOnlyPendingTimersAsync();
    expect(discovery.getExtensionId("garmin-bridge")).toBe("garmin-ext-id");
    expect(discovery.getExtensionId("train2go-bridge")).toBe("train2go-ext-id");

    // Act
    discovery.stop();

    // Assert
  });

  it("should ignore announcements with invalid shape", async () => {
    // Arrange
    const verify = vi.fn().mockResolvedValue({
      id: "x",
      name: "x",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: [],
    });
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();
    emit({ type: "KAIORD_BRIDGE_ANNOUNCE" });
    emit({ foo: "bar" });
    emit(null);
    await vi.runOnlyPendingTimersAsync();
    expect(verify).not.toHaveBeenCalled();
    expect(discovery.getExtensionId("garmin-bridge")).toBeNull();

    // Act
    discovery.stop();

    // Assert
  });

  it("should post KAIORD_BRIDGE_DISCOVER after 3s when no bridges announced", () => {
    // Arrange
    const postSpy = vi.spyOn(window, "postMessage");
    const discovery = createBridgeDiscovery({
      verify: vi.fn().mockResolvedValue({
        id: "x",
        name: "x",
        version: "1.0.0",
        protocolVersion: 1,
        capabilities: [],
      }),
    });
    discovery.start();
    vi.advanceTimersByTime(DISCOVERY_INTERVAL_TICK_MS);
    expect(postSpy).toHaveBeenCalledWith(
      { type: "KAIORD_BRIDGE_DISCOVER" },
      "*"
    );

    // Act
    discovery.stop();

    // Assert
  });

  it("should not post KAIORD_BRIDGE_DISCOVER when a bridge has already announced", async () => {
    // Arrange
    const postSpy = vi.spyOn(window, "postMessage");
    const discovery = createBridgeDiscovery({
      verify: vi.fn().mockResolvedValue({
        id: "x",
        name: "x",
        version: "1.0.0",
        protocolVersion: 1,
        capabilities: [],
      }),
    });
    discovery.start();
    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();
    postSpy.mockClear();
    vi.advanceTimersByTime(DISCOVERY_INTERVAL_TICK_MS);
    expect(postSpy).not.toHaveBeenCalled();

    // Act
    discovery.stop();

    // Assert
  });

  it("should notify subscribers when a bridge is registered", async () => {
    // Arrange
    const listener = vi.fn();
    const discovery = createBridgeDiscovery({
      verify: vi.fn().mockResolvedValue({
        id: "x",
        name: "x",
        version: "1.0.0",
        protocolVersion: 1,
        capabilities: [],
      }),
    });
    discovery.start();
    discovery.subscribe(listener);
    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();
    expect(listener).toHaveBeenCalledTimes(1);

    // Act
    discovery.stop();

    // Assert
  });

  it("should unsubscribe cleanly", async () => {
    // Arrange
    const listener = vi.fn();
    const discovery = createBridgeDiscovery({
      verify: vi.fn().mockResolvedValue({
        id: "x",
        name: "x",
        version: "1.0.0",
        protocolVersion: 1,
        capabilities: [],
      }),
    });
    discovery.start();
    const unsubscribe = discovery.subscribe(listener);
    unsubscribe();
    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();
    expect(listener).not.toHaveBeenCalled();

    // Act
    discovery.stop();

    // Assert
  });

  it("should skip verification when the same announcement is received twice", async () => {
    // Arrange
    const verify = vi.fn().mockResolvedValue({
      id: "x",
      name: "x",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: [],
    });
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();
    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();
    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();
    expect(verify).toHaveBeenCalledTimes(1);

    // Act
    discovery.stop();

    // Assert
  });

  it("should remove window listeners on stop()", async () => {
    // Arrange
    const verify = vi.fn().mockResolvedValue({
      id: "x",
      name: "x",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: [],
    });
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();
    discovery.stop();
    emit(ANNOUNCE_GARMIN);

    // Act
    await vi.runOnlyPendingTimersAsync();

    // Assert
    expect(verify).not.toHaveBeenCalled();
  });
});

describe("bridgeDiscovery singleton (HMR resilience)", () => {
  type GlobalShape = { __KAIORD_BRIDGE_DISCOVERY__?: unknown };

  it("should be parked on globalThis after first evaluation", async () => {
    // Arrange
    const mod = await import("./bridge-discovery");

    // Act
    const g = globalThis as unknown as GlobalShape;

    // Assert
    expect(g.__KAIORD_BRIDGE_DISCOVERY__).toBe(mod.bridgeDiscovery);
  });

  it("should return the same instance on a fresh re-import (HMR scenario)", async () => {
    // Arrange
    const first = await import("./bridge-discovery");
    vi.resetModules();

    // Act
    const second = await import("./bridge-discovery");

    // Assert
    expect(second.bridgeDiscovery).toBe(first.bridgeDiscovery);
  });
});
