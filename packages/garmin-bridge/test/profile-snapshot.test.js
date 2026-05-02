import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "./chrome-mock.js";
import {
  validateSnapshot,
  isAllowedSenderOrigin,
} from "../profile-snapshot.js";
import * as bridge from "../background.js";
import {
  positiveSnapshotFixtures,
  negativeSnapshotFixtures,
} from "@kaiord/core/test-utils";

beforeEach(() => {
  globalThis.__resetChromeMock();
});

afterEach(() => {
  globalThis.__resetChromeMock();
});

const ALLOWED_KEY_ORIGIN = { origin: "https://app.kaiord.com" };

describe("validateSnapshot — parity with @kaiord/core fixtures", () => {
  it.each(positiveSnapshotFixtures)(
    "accepts positive fixture %#",
    (fixture) => {
      const result = validateSnapshot(fixture);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(fixture);
      }
    }
  );

  // Bridge error messages are wire-level constants per spec
  // ("Invalid snapshot payload" | "Snapshot too large" |
  //  "Unsupported snapshot schema version"); we assert REJECT
  // parity here. Field-level error regexes are covered by the
  // Zod-side test in @kaiord/core.
  it.each(negativeSnapshotFixtures)(
    "rejects negative fixture $name",
    ({ value }) => {
      const result = validateSnapshot(value);

      expect(result.ok).toBe(false);
    }
  );

  it("does not mutate Object.prototype on a poisoned payload", () => {
    const before = "isAdmin" in Object.prototype;
    const polluted = JSON.parse(
      `{"__proto__":{"isAdmin":true},"schemaVersion":1,"profile":{"name":"P"},"generatedAt":"2026-05-01T00:00:00.000Z"}`
    );

    validateSnapshot(polluted);

    expect("isAdmin" in Object.prototype).toBe(before);
  });
});

describe("isAllowedSenderOrigin", () => {
  it("accepts production kaiord origins", () => {
    expect(isAllowedSenderOrigin({ origin: "https://app.kaiord.com" })).toBe(
      true
    );
    expect(
      isAllowedSenderOrigin({ origin: "https://staging.kaiord.com" })
    ).toBe(true);
  });

  it("accepts dev localhost origins on the documented ports", () => {
    expect(isAllowedSenderOrigin({ origin: "http://localhost:5173" })).toBe(
      true
    );
    expect(isAllowedSenderOrigin({ origin: "http://localhost:5174" })).toBe(
      true
    );
  });

  it("rejects undefined origin", () => {
    expect(isAllowedSenderOrigin({})).toBe(false);
    expect(isAllowedSenderOrigin(undefined)).toBe(false);
  });

  it("rejects unauthorized origins", () => {
    expect(isAllowedSenderOrigin({ origin: "https://attacker.example" })).toBe(
      false
    );
    expect(isAllowedSenderOrigin({ origin: "http://localhost:9999" })).toBe(
      false
    );
  });
});

describe("background — profile-snapshot action", () => {
  it("persists a valid snapshot to chrome.storage.local with receivedAt", async () => {
    const valid = positiveSnapshotFixtures[0];

    const result = await bridge.persistSnapshot(valid);

    expect(result.storedAt).toBeTypeOf("number");
    const stored = globalThis.__chromeLocalStore.profileSnapshot;
    expect(stored).toMatchObject(valid);
    expect(stored.receivedAt).toBe(result.storedAt);
  });

  it("writes lastPushReceipt atomically with the snapshot", async () => {
    const valid = positiveSnapshotFixtures[0];

    const result = await bridge.persistSnapshot(valid);

    const receipt = globalThis.__chromeLocalStore.lastPushReceipt;
    expect(receipt).toBeDefined();
    expect(receipt.at).toBe(result.storedAt);
    expect(receipt.name).toBe(valid.profile.name);
  });

  it("rejects an invalid payload as non-retryable error", async () => {
    await expect(bridge.persistSnapshot({ schemaVersion: 99 })).rejects.toThrow(
      "Unsupported snapshot schema version"
    );
    expect(globalThis.__chromeLocalStore.profileSnapshot).toBeUndefined();
  });

  it("clearSnapshot removes profileSnapshot, lastWeeklyRollup and lastPushReceipt", async () => {
    globalThis.__chromeLocalStore.profileSnapshot = { keep: "no" };
    globalThis.__chromeLocalStore.lastWeeklyRollup = { keep: "no" };
    globalThis.__chromeLocalStore.lastPushReceipt = { at: 1, name: "x" };
    globalThis.__chromeLocalStore.somethingElse = "untouched";

    const result = await bridge.clearSnapshot();

    expect(result).toBeNull();
    expect(globalThis.__chromeLocalStore.profileSnapshot).toBeUndefined();
    expect(globalThis.__chromeLocalStore.lastWeeklyRollup).toBeUndefined();
    expect(globalThis.__chromeLocalStore.lastPushReceipt).toBeUndefined();
    expect(globalThis.__chromeLocalStore.somethingElse).toBe("untouched");
  });

  it("does not call garminFetch for snapshot actions", async () => {
    const fetchSpy = vi.spyOn(bridge, "garminFetch");

    await bridge.persistSnapshot(positiveSnapshotFixtures[0]);
    await bridge.clearSnapshot();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("background — handleExternalMessage origin gate", () => {
  const validSnapshot = positiveSnapshotFixtures[0];

  it("rejects profile-snapshot from a disallowed origin", async () => {
    const sendResponse = vi.fn();

    const handled = bridge.handleExternalMessage(
      { action: "profile-snapshot", snapshot: validSnapshot },
      { origin: "https://attacker.example" },
      sendResponse
    );

    expect(handled).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      protocolVersion: 1,
      error: "Origin not permitted",
      retryable: false,
    });
    expect(globalThis.__chromeLocalStore.profileSnapshot).toBeUndefined();
  });

  it("rejects when sender.origin is undefined (defense in depth)", async () => {
    const sendResponse = vi.fn();

    bridge.handleExternalMessage(
      { action: "profile-snapshot-clear" },
      {},
      sendResponse
    );

    await new Promise((r) => setTimeout(r, 10));
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: "Origin not permitted" })
    );
  });

  it("permits profile-snapshot from a kaiord.com origin", async () => {
    const sendResponse = vi.fn();

    bridge.handleExternalMessage(
      { action: "profile-snapshot", snapshot: validSnapshot },
      ALLOWED_KEY_ORIGIN,
      sendResponse
    );

    await new Promise((r) => setTimeout(r, 10));
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, protocolVersion: 1 })
    );
  });

  it("non-snapshot actions bypass the origin gate (existing actions unaffected)", async () => {
    const sendResponse = vi.fn();

    bridge.handleExternalMessage(
      { action: "open-garmin" },
      { origin: "anything" },
      sendResponse
    );

    await new Promise((r) => setTimeout(r, 10));
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, protocolVersion: 1 })
    );
  });

  it("propagates handler errors via sendError envelope", async () => {
    const sendResponse = vi.fn();

    bridge.handleExternalMessage(
      { action: "profile-snapshot", snapshot: { schemaVersion: 99 } },
      ALLOWED_KEY_ORIGIN,
      sendResponse
    );

    await new Promise((r) => setTimeout(r, 10));
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        protocolVersion: 1,
        error: "Unsupported snapshot schema version",
      })
    );
  });

  it("rejects oversized snapshot with the wire-level error", async () => {
    const oversized = {
      schemaVersion: 1,
      profile: { name: "x".repeat(100) },
      thresholds: {},
      heartRate: {},
      generatedAt: "2026-05-01T00:00:00.000Z",
      // pad to push over the 8192 cap
      activeSport: "cycling",
    };
    // Force oversize by stuffing a giant top-level rejected key path:
    // the validator checks size before allowed-key check, so a known-rejected
    // payload still hits the size branch. Build the oversize via name length
    // to be safe.
    oversized.profile.name = "x".repeat(9000);

    await expect(bridge.persistSnapshot(oversized)).rejects.toThrow(
      "Snapshot too large"
    );
  });
});

describe("background — handleAction routing", () => {
  it("routes profile-snapshot through the switch", async () => {
    const result = await bridge.handleAction({
      action: "profile-snapshot",
      snapshot: positiveSnapshotFixtures[0],
    });

    expect(result.storedAt).toBeTypeOf("number");
    expect(globalThis.__chromeLocalStore.profileSnapshot).toMatchObject(
      positiveSnapshotFixtures[0]
    );
  });

  it("routes profile-snapshot-clear through the switch", async () => {
    globalThis.__chromeLocalStore.profileSnapshot = { dummy: true };

    const result = await bridge.handleAction({
      action: "profile-snapshot-clear",
    });

    expect(result).toBeNull();
    expect(globalThis.__chromeLocalStore.profileSnapshot).toBeUndefined();
  });

  it("rejects an unknown action with a descriptive error", async () => {
    await expect(
      bridge.handleAction({ action: "no-such-action" })
    ).rejects.toThrow(/Unknown action/);
  });
});
