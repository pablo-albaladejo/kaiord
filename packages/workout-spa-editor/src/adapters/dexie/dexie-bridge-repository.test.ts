import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

import { pruneStale } from "../bridge/bridge-registry-helpers";
import type { RegisteredBridge } from "../bridge/bridge-types";
import { createDexieBridgeRepository } from "./dexie-bridge-repository";
import { KaiordDatabase } from "./dexie-database";

const HOUR = 60 * 60 * 1_000;
const DAY = 24 * HOUR;

describe("DexieBridgeRepository", () => {
  let db: KaiordDatabase;

  beforeEach(async () => {
    // Fresh database name per test isolates IDB state without needing
    // cross-suite cleanup.
    db = new KaiordDatabase(
      `kaiord-bridges-test-${Date.now()}-${Math.random()}`
    );
  });

  it("persists bridges keyed by extensionId", async () => {
    const repo = createDexieBridgeRepository(db);
    const bridge: RegisteredBridge = {
      extensionId: "ext-1",
      id: "garmin-bridge",
      name: "Garmin Bridge",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: ["write:workouts"],
      status: "verified",
      lastSeen: "2026-04-20T10:00:00Z",
      failCount: 0,
    };

    await repo.put(bridge);
    const all = await repo.getAll();

    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(bridge);
  });

  it("upserts on put", async () => {
    const repo = createDexieBridgeRepository(db);
    const base: RegisteredBridge = {
      extensionId: "ext-1",
      id: "garmin-bridge",
      name: "Garmin Bridge",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: ["write:workouts"],
      status: "verified",
      lastSeen: "2026-04-20T10:00:00Z",
      failCount: 0,
    };

    await repo.put(base);
    await repo.put({ ...base, status: "unavailable", failCount: 3 });
    const all = await repo.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].status).toBe("unavailable");
    expect(all[0].failCount).toBe(3);
  });

  it("deletes by extensionId", async () => {
    const repo = createDexieBridgeRepository(db);
    await repo.put({
      extensionId: "ext-1",
      id: "garmin-bridge",
      name: "Garmin Bridge",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: ["write:workouts"],
      status: "removed",
      lastSeen: "2026-04-18T10:00:00Z",
      failCount: 4,
      removedAt: Date.UTC(2026, 3, 19),
    });

    await repo.delete("ext-1");

    expect(await repo.getAll()).toHaveLength(0);
  });

  it("resumes the 24h-unavailable timer from persisted lastSeen", async () => {
    // Seed a bridge 22h into its unavailable state, then simulate a
    // page reload by re-reading from Dexie. The pruning timer must
    // resume from the persisted lastSeen (not from zero).
    const repo = createDexieBridgeRepository(db);
    const now = Date.UTC(2026, 3, 20, 10, 0, 0);
    await repo.put({
      extensionId: "ext-reload",
      id: "garmin-bridge",
      name: "Garmin Bridge",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: ["write:workouts"],
      status: "unavailable",
      lastSeen: new Date(now - 22 * HOUR).toISOString(),
      failCount: 3,
    });

    // Simulate reload: fresh in-memory map populated from Dexie.
    const restored = await repo.getAll();
    const bridges = new Map(restored.map((b) => [b.extensionId, b]));

    // 3 hours later (25h total elapsed since lastSeen) — must transition
    // to removed because the timer picked up from the persisted anchor.
    pruneStale(bridges, { now: now + 3 * HOUR });

    expect(bridges.get("ext-reload")?.status).toBe("removed");
  });

  it("keeps the 'unavailable' status if elapsed is still under 24h across reload", async () => {
    const repo = createDexieBridgeRepository(db);
    const now = Date.UTC(2026, 3, 20, 10, 0, 0);
    await repo.put({
      extensionId: "ext-fresh",
      id: "garmin-bridge",
      name: "Garmin Bridge",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: ["write:workouts"],
      status: "unavailable",
      lastSeen: new Date(now - 10 * HOUR).toISOString(),
      failCount: 3,
    });

    const restored = await repo.getAll();
    const bridges = new Map(restored.map((b) => [b.extensionId, b]));

    // Still only 10h elapsed after a hypothetical reload right after.
    pruneStale(bridges, { now });

    expect(bridges.get("ext-fresh")?.status).toBe("unavailable");
  });

  it("deletes via onDeleted callback routing to repo.delete", async () => {
    const repo = createDexieBridgeRepository(db);
    const now = Date.UTC(2026, 3, 20, 10, 0, 0);
    await repo.put({
      extensionId: "ext-gone",
      id: "garmin-bridge",
      name: "Garmin Bridge",
      version: "1.0.0",
      protocolVersion: 1,
      capabilities: ["write:workouts"],
      status: "removed",
      lastSeen: new Date(now - 3 * DAY).toISOString(),
      removedAt: now - DAY - HOUR,
      failCount: 4,
    });

    const restored = await repo.getAll();
    const bridges = new Map(restored.map((b) => [b.extensionId, b]));

    pruneStale(bridges, {
      now,
      onDeleted: (id) => void repo.delete(id),
    });

    // Allow microtasks to drain the void-awaited delete.
    await Promise.resolve();

    expect(await repo.getAll()).toHaveLength(0);
  });
});
