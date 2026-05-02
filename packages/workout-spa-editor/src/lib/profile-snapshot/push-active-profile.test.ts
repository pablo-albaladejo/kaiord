import { describe, expect, it, vi } from "vitest";

import type {
  BridgeRepository,
  RegisteredBridge,
} from "../../adapters/bridge/bridge-types";
import type { Profile } from "../../types/profile";

import { clearActiveProfile, pushActiveProfile } from "./push-active-profile";

const FIXED_NOW = new Date("2026-05-02T08:00:00.000Z");

const baseProfile: Profile = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Pablo",
  bodyWeight: 72,
  sportZones: {
    cycling: {
      thresholds: { ftp: 270, lthr: 168 },
      heartRateZones: { method: "manual", zones: [] },
      powerZones: { method: "manual", zones: [] },
    },
  },
  linkedAccounts: [],
  createdAt: FIXED_NOW.toISOString(),
  updatedAt: FIXED_NOW.toISOString(),
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
  lastSeen: "2026-05-02T07:50:00.000Z",
  failCount: 0,
  ...overrides,
});

const setupRepo = (initial: RegisteredBridge[]): BridgeRepository => {
  const store = new Map<string, RegisteredBridge>(
    initial.map((b) => [b.extensionId, b])
  );
  return {
    getAll: async () => [...store.values()],
    put: async (b) => {
      store.set(b.extensionId, b);
    },
    delete: async (id) => {
      store.delete(id);
    },
  };
};

const passThrough = <T>(args: { execute: () => Promise<T> }): Promise<T> =>
  args.execute();

describe("pushActiveProfile", () => {
  it("dispatches one transport call per VERIFIED bridge", async () => {
    const transport = vi.fn().mockResolvedValue({ ok: true });
    const bridgesRepo = setupRepo([
      verified({ extensionId: "ext-1" }),
      verified({ extensionId: "ext-2" }),
    ]);
    const bridges = await bridgesRepo.getAll();

    await pushActiveProfile(baseProfile, bridges, {
      transport,
      bridgesRepo,
      enqueue: passThrough,
    });

    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls.map((c) => c[0])).toEqual(["ext-1", "ext-2"]);
  });

  it("skips UNAVAILABLE bridges", async () => {
    const transport = vi.fn().mockResolvedValue({ ok: true });
    const bridgesRepo = setupRepo([
      verified({ extensionId: "ext-1", status: "unavailable" }),
      verified({ extensionId: "ext-2" }),
    ]);
    const bridges = await bridgesRepo.getAll();

    await pushActiveProfile(baseProfile, bridges, {
      transport,
      bridgesRepo,
      enqueue: passThrough,
    });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toBe("ext-2");
  });

  it("does nothing when no bridges are registered", async () => {
    const transport = vi.fn();

    await pushActiveProfile(baseProfile, [], {
      transport,
      bridgesRepo: setupRepo([]),
      enqueue: passThrough,
    });

    expect(transport).not.toHaveBeenCalled();
  });

  it("derives a snapshot with the profile's FTP and ships it on the wire", async () => {
    const transport = vi.fn().mockResolvedValue({ ok: true });
    const bridgesRepo = setupRepo([verified()]);
    const bridges = await bridgesRepo.getAll();

    await pushActiveProfile(baseProfile, bridges, {
      transport,
      bridgesRepo,
      enqueue: passThrough,
    });

    const message = transport.mock.calls[0][1] as {
      action: string;
      snapshot: { thresholds: { cycling?: { ftp?: number } } };
    };
    expect(message.action).toBe("profile-snapshot");
    expect(message.snapshot.thresholds.cycling?.ftp).toBe(270);
  });

  it("swallows per-bridge errors so one failing bridge does not block the others", async () => {
    const transport = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("boom")))
      .mockResolvedValueOnce({ ok: true });
    const bridgesRepo = setupRepo([
      verified({ extensionId: "ext-fail" }),
      verified({ extensionId: "ext-ok" }),
    ]);
    const bridges = await bridgesRepo.getAll();

    await expect(
      pushActiveProfile(baseProfile, bridges, {
        transport,
        bridgesRepo,
        enqueue: passThrough,
      })
    ).resolves.toBeUndefined();
    expect(transport).toHaveBeenCalledTimes(2);
  });
});

describe("clearActiveProfile", () => {
  it("emits profile-snapshot-clear to every VERIFIED bridge", async () => {
    const transport = vi.fn().mockResolvedValue({ ok: true });
    const bridgesRepo = setupRepo([
      verified({ extensionId: "ext-1" }),
      verified({ extensionId: "ext-2" }),
    ]);
    const bridges = await bridgesRepo.getAll();

    await clearActiveProfile(bridges, {
      transport,
      bridgesRepo,
      enqueue: passThrough,
    });

    expect(transport).toHaveBeenCalledTimes(2);
    for (const call of transport.mock.calls) {
      expect(call[1]).toEqual({ action: "profile-snapshot-clear" });
    }
  });

  it("is a no-op when no bridges are registered", async () => {
    const transport = vi.fn();
    await clearActiveProfile([], {
      transport,
      bridgesRepo: setupRepo([]),
      enqueue: passThrough,
    });
    expect(transport).not.toHaveBeenCalled();
  });
});
