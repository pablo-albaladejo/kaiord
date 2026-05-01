import { describe, expect, it, vi } from "vitest";

import type { ProfileSnapshot } from "@kaiord/core";

import type {
  BridgeRepository,
  RegisteredBridge,
} from "../../adapters/bridge/bridge-types";

import { createSnapshotPusher } from "./snapshot-pusher";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const SNAPSHOT_A: ProfileSnapshot = {
  schemaVersion: 1,
  profile: { name: "Pablo" },
  thresholds: { cycling: { ftp: 270 } },
  heartRate: {},
  generatedAt: "2026-05-01T08:00:00.000Z",
};
const SNAPSHOT_B: ProfileSnapshot = {
  schemaVersion: 1,
  profile: { name: "Pablo" },
  thresholds: { cycling: { ftp: 280 } }, // FTP changed
  heartRate: {},
  generatedAt: "2026-05-01T08:00:00.000Z",
};

const verified = (
  overrides: Partial<RegisteredBridge> = {}
): RegisteredBridge => ({
  extensionId: "ext-1",
  id: "garmin-bridge",
  name: "Garmin",
  version: "7.1.0",
  protocolVersion: 1,
  capabilities: ["write:workouts"],
  status: "verified",
  lastSeen: "2026-05-01T07:50:00.000Z",
  failCount: 0,
  ...overrides,
});

const setupBridges = (
  initial: RegisteredBridge
): {
  bridges: BridgeRepository;
  store: Map<string, RegisteredBridge>;
} => {
  const store = new Map<string, RegisteredBridge>([
    [initial.extensionId, initial],
  ]);
  return {
    store,
    bridges: {
      getAll: async () => [...store.values()],
      put: async (b) => {
        store.set(b.extensionId, b);
      },
      delete: async (id) => {
        store.delete(id);
      },
    },
  };
};

const passThroughEnqueue = <T>(args: {
  bridgeId: string;
  execute: () => Promise<T>;
}): Promise<T> => args.execute();

describe("snapshot pusher — pushSnapshot", () => {
  it("sends and persists fingerprint on ok ack", async () => {
    const { bridges, store } = setupBridges(verified());
    const transport = vi.fn().mockResolvedValue({ ok: true });
    const pusher = createSnapshotPusher({
      transport,
      bridges,
      enqueue: passThroughEnqueue,
    });

    const outcome = await pusher.pushSnapshot(
      verified(),
      SNAPSHOT_A,
      PROFILE_ID
    );

    expect(outcome).toBe("sent");
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][1]).toEqual({
      action: "profile-snapshot",
      snapshot: SNAPSHOT_A,
    });
    expect(store.get("ext-1")?.lastSuccessfulFingerprint).toMatch(
      /^[0-9a-f]{8}$/
    );
  });

  it("dedupes when fingerprint matches the persisted one", async () => {
    const transport = vi.fn().mockResolvedValue({ ok: true });
    const { bridges } = setupBridges(verified());
    const pusher = createSnapshotPusher({
      transport,
      bridges,
      enqueue: passThroughEnqueue,
    });

    const first = await pusher.pushSnapshot(verified(), SNAPSHOT_A, PROFILE_ID);
    expect(first).toBe("sent");
    const fingerprint = (await bridges.getAll())[0].lastSuccessfulFingerprint;

    const second = await pusher.pushSnapshot(
      verified({ lastSuccessfulFingerprint: fingerprint }),
      SNAPSHOT_A,
      PROFILE_ID
    );

    expect(second).toBe("deduped");
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("re-sends when content differs even if generatedAt is identical", async () => {
    const transport = vi.fn().mockResolvedValue({ ok: true });
    const { bridges } = setupBridges(verified());
    const pusher = createSnapshotPusher({
      transport,
      bridges,
      enqueue: passThroughEnqueue,
    });

    await pusher.pushSnapshot(verified(), SNAPSHOT_A, PROFILE_ID);
    const fingerprint = (await bridges.getAll())[0].lastSuccessfulFingerprint;

    const outcome = await pusher.pushSnapshot(
      verified({ lastSuccessfulFingerprint: fingerprint }),
      SNAPSHOT_B,
      PROFILE_ID
    );

    expect(outcome).toBe("sent");
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("does not update fingerprint on ok:false response", async () => {
    const transport = vi.fn().mockResolvedValue({ ok: false, error: "Boom" });
    const { bridges, store } = setupBridges(
      verified({ lastSuccessfulFingerprint: "deadbeef" })
    );
    const pusher = createSnapshotPusher({
      transport,
      bridges,
      enqueue: passThroughEnqueue,
    });

    const outcome = await pusher.pushSnapshot(
      verified({ lastSuccessfulFingerprint: "deadbeef" }),
      SNAPSHOT_A,
      PROFILE_ID
    );

    expect(outcome).toBe("failed");
    expect(store.get("ext-1")?.lastSuccessfulFingerprint).toBe("deadbeef");
  });

  it("returns rate-limited when the queue rejects", async () => {
    const transport = vi.fn();
    const { bridges } = setupBridges(verified());
    const pusher = createSnapshotPusher({
      transport,
      bridges,
      enqueue: () =>
        Promise.reject(
          new Error("Rate limit reached for bridge garmin-bridge")
        ),
    });

    const outcome = await pusher.pushSnapshot(
      verified(),
      SNAPSHOT_A,
      PROFILE_ID
    );

    expect(outcome).toBe("rate-limited");
    expect(transport).not.toHaveBeenCalled();
  });

  it("skips UNAVAILABLE bridges entirely", async () => {
    const transport = vi.fn();
    const { bridges } = setupBridges(verified({ status: "unavailable" }));
    const pusher = createSnapshotPusher({
      transport,
      bridges,
      enqueue: passThroughEnqueue,
    });

    const outcome = await pusher.pushSnapshot(
      verified({ status: "unavailable" }),
      SNAPSHOT_A,
      PROFILE_ID
    );

    expect(outcome).toBe("skipped");
    expect(transport).not.toHaveBeenCalled();
  });
});

describe("snapshot pusher — clearSnapshot", () => {
  it("sends profile-snapshot-clear to a VERIFIED bridge and resets state", async () => {
    const transport = vi.fn().mockResolvedValue({ ok: true });
    const { bridges, store } = setupBridges(
      verified({ lastSuccessfulFingerprint: "deadbeef" })
    );
    const pusher = createSnapshotPusher({
      transport,
      bridges,
      enqueue: passThroughEnqueue,
    });

    const outcome = await pusher.clearSnapshot(
      verified({ lastSuccessfulFingerprint: "deadbeef" })
    );

    expect(outcome).toBe("sent");
    expect(transport).toHaveBeenCalledWith("ext-1", {
      action: "profile-snapshot-clear",
    });
    expect(store.get("ext-1")?.lastSuccessfulFingerprint).toBeNull();
    expect(store.get("ext-1")?.pendingClear).toBe(false);
  });

  it("sets pendingClear when the bridge is UNAVAILABLE", async () => {
    const transport = vi.fn();
    const { bridges, store } = setupBridges(
      verified({ status: "unavailable" })
    );
    const pusher = createSnapshotPusher({
      transport,
      bridges,
      enqueue: passThroughEnqueue,
    });

    const outcome = await pusher.clearSnapshot(
      verified({ status: "unavailable" })
    );

    expect(outcome).toBe("skipped");
    expect(transport).not.toHaveBeenCalled();
    expect(store.get("ext-1")?.pendingClear).toBe(true);
  });
});
