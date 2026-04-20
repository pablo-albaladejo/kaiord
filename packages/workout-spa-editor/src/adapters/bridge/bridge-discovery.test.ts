import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBridgeDiscovery } from "./bridge-discovery";
import type { BridgeAnnouncement } from "./bridge-discovery-types";

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

  it("registers extension id after a verified announcement", async () => {
    const verify = vi.fn().mockResolvedValue(true);
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();

    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();

    expect(verify).toHaveBeenCalledWith(ANNOUNCE_GARMIN);
    expect(discovery.getExtensionId("garmin-bridge")).toBe("garmin-ext-id");
    discovery.stop();
  });

  it("rejects announcements that fail verification (spoof)", async () => {
    const verify = vi.fn().mockResolvedValue(false);
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();

    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();

    expect(discovery.getExtensionId("garmin-bridge")).toBeNull();
    discovery.stop();
  });

  it("registers multiple bridges independently", async () => {
    const verify = vi.fn().mockResolvedValue(true);
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();

    emit(ANNOUNCE_GARMIN);
    emit(ANNOUNCE_TRAIN2GO);
    await vi.runOnlyPendingTimersAsync();

    expect(discovery.getExtensionId("garmin-bridge")).toBe("garmin-ext-id");
    expect(discovery.getExtensionId("train2go-bridge")).toBe("train2go-ext-id");
    discovery.stop();
  });

  it("ignores announcements with invalid shape", async () => {
    const verify = vi.fn().mockResolvedValue(true);
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();

    emit({ type: "KAIORD_BRIDGE_ANNOUNCE" });
    emit({ foo: "bar" });
    emit(null);
    await vi.runOnlyPendingTimersAsync();

    expect(verify).not.toHaveBeenCalled();
    expect(discovery.getExtensionId("garmin-bridge")).toBeNull();
    discovery.stop();
  });

  it("posts KAIORD_BRIDGE_DISCOVER after 3s when no bridges announced", () => {
    const postSpy = vi.spyOn(window, "postMessage");
    const discovery = createBridgeDiscovery({
      verify: vi.fn().mockResolvedValue(true),
    });
    discovery.start();

    vi.advanceTimersByTime(3_000);

    expect(postSpy).toHaveBeenCalledWith(
      { type: "KAIORD_BRIDGE_DISCOVER" },
      "*"
    );
    discovery.stop();
  });

  it("does not post KAIORD_BRIDGE_DISCOVER when a bridge has already announced", async () => {
    const postSpy = vi.spyOn(window, "postMessage");
    const discovery = createBridgeDiscovery({
      verify: vi.fn().mockResolvedValue(true),
    });
    discovery.start();

    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();
    postSpy.mockClear();

    vi.advanceTimersByTime(3_000);

    expect(postSpy).not.toHaveBeenCalled();
    discovery.stop();
  });

  it("notifies subscribers when a bridge is registered", async () => {
    const listener = vi.fn();
    const discovery = createBridgeDiscovery({
      verify: vi.fn().mockResolvedValue(true),
    });
    discovery.start();
    discovery.subscribe(listener);

    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();

    expect(listener).toHaveBeenCalledTimes(1);
    discovery.stop();
  });

  it("unsubscribes cleanly", async () => {
    const listener = vi.fn();
    const discovery = createBridgeDiscovery({
      verify: vi.fn().mockResolvedValue(true),
    });
    discovery.start();
    const unsubscribe = discovery.subscribe(listener);

    unsubscribe();
    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();

    expect(listener).not.toHaveBeenCalled();
    discovery.stop();
  });

  it("skips verification when the same announcement is received twice", async () => {
    const verify = vi.fn().mockResolvedValue(true);
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();

    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();
    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();

    expect(verify).toHaveBeenCalledTimes(1);
    discovery.stop();
  });

  it("removes window listeners on stop()", async () => {
    const verify = vi.fn().mockResolvedValue(true);
    const discovery = createBridgeDiscovery({ verify });
    discovery.start();
    discovery.stop();

    emit(ANNOUNCE_GARMIN);
    await vi.runOnlyPendingTimersAsync();

    expect(verify).not.toHaveBeenCalled();
  });
});
