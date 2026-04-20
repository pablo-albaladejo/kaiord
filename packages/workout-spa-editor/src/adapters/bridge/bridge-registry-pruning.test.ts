import { describe, expect, it, vi } from "vitest";

import { PRUNE_AFTER_MS, pruneStale } from "./bridge-registry-helpers";
import type { RegisteredBridge } from "./bridge-types";

function seedBridge(
  overrides: Partial<RegisteredBridge> = {}
): RegisteredBridge {
  return {
    extensionId: "ext-1",
    id: "garmin-bridge",
    name: "Garmin Bridge",
    version: "1.0.0",
    protocolVersion: 1,
    capabilities: ["write:workouts"],
    status: "verified",
    lastSeen: new Date().toISOString(),
    failCount: 0,
    ...overrides,
  };
}

describe("pruneStale — REMOVED lifecycle", () => {
  it("transitions unavailable → removed after 24h and notifies", () => {
    const now = Date.now();
    const bridge = seedBridge({
      status: "unavailable",
      lastSeen: new Date(now - PRUNE_AFTER_MS - 1).toISOString(),
    });
    const bridges = new Map([[bridge.extensionId, bridge]]);
    const notifier = vi.fn();

    pruneStale(bridges, { now, notifier });

    expect(bridge.status).toBe("removed");
    expect(bridge.removedAt).toBe(now);
    expect(notifier).toHaveBeenCalledWith({
      type: "removed",
      bridge,
    });
    expect(bridges.has("ext-1")).toBe(true); // entry kept
  });

  it("does not fire the notifier for unavailable bridges still fresh", () => {
    const now = Date.now();
    const bridge = seedBridge({
      status: "unavailable",
      lastSeen: new Date(now - 60_000).toISOString(),
    });
    const bridges = new Map([[bridge.extensionId, bridge]]);
    const notifier = vi.fn();

    pruneStale(bridges, { now, notifier });

    expect(bridge.status).toBe("unavailable");
    expect(notifier).not.toHaveBeenCalled();
  });

  it("does not re-notify on a second prune tick when already removed", () => {
    const now = Date.now();
    const bridge = seedBridge({
      status: "removed",
      removedAt: now - 60_000,
      lastSeen: new Date(now - PRUNE_AFTER_MS - 60_000).toISOString(),
    });
    const bridges = new Map([[bridge.extensionId, bridge]]);
    const notifier = vi.fn();

    pruneStale(bridges, { now, notifier });

    // Still within 24h of removedAt, so no deletion yet, and no second
    // notification.
    expect(bridges.has("ext-1")).toBe(true);
    expect(notifier).not.toHaveBeenCalled();
  });

  it("deletes the entry 24h after it was marked removed (second tick)", () => {
    const now = Date.now();
    const bridge = seedBridge({
      status: "removed",
      removedAt: now - PRUNE_AFTER_MS - 1,
      lastSeen: new Date(now - 2 * PRUNE_AFTER_MS).toISOString(),
    });
    const bridges = new Map([[bridge.extensionId, bridge]]);
    const onDeleted = vi.fn();

    pruneStale(bridges, { now, onDeleted });

    expect(bridges.has("ext-1")).toBe(false);
    expect(onDeleted).toHaveBeenCalledWith("ext-1");
  });

  it("calls onPersist when transitioning to removed so Dexie stays in sync", () => {
    const now = Date.now();
    const bridge = seedBridge({
      status: "unavailable",
      lastSeen: new Date(now - PRUNE_AFTER_MS - 1).toISOString(),
    });
    const bridges = new Map([[bridge.extensionId, bridge]]);
    const onPersist = vi.fn();

    pruneStale(bridges, { now, onPersist });

    expect(onPersist).toHaveBeenCalledWith(bridge);
    expect(onPersist.mock.calls[0][0].status).toBe("removed");
  });

  it("falls back to lastSeen when removedAt is missing on a restored row", () => {
    // Simulates a bridge loaded from Dexie that was persisted before the
    // `removedAt` field existed. The timer must still resolve.
    const now = Date.now();
    const bridge = seedBridge({
      status: "removed",
      lastSeen: new Date(now - PRUNE_AFTER_MS - 10).toISOString(),
    });
    const bridges = new Map([[bridge.extensionId, bridge]]);

    pruneStale(bridges, { now });

    expect(bridges.has("ext-1")).toBe(false);
  });

  it("leaves verified bridges untouched", () => {
    const bridge = seedBridge({ status: "verified" });
    const bridges = new Map([[bridge.extensionId, bridge]]);
    const notifier = vi.fn();

    pruneStale(bridges, { now: Date.now(), notifier });

    expect(bridge.status).toBe("verified");
    expect(notifier).not.toHaveBeenCalled();
  });
});
