import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "./chrome-mock.js";
import {
  validateSnapshot,
  isAllowedSenderOrigin,
} from "../profile-snapshot.js";
import {
  positiveSnapshotFixtures,
  negativeSnapshotFixtures,
} from "@kaiord/core/test-utils";

let bridge;

beforeEach(async () => {
  globalThis.__resetChromeMock();
  vi.resetModules();
  bridge = await import("../background.js");
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

  it("rejects an invalid payload as non-retryable error", async () => {
    await expect(bridge.persistSnapshot({ schemaVersion: 99 })).rejects.toThrow(
      "Unsupported snapshot schema version"
    );
    expect(globalThis.__chromeLocalStore.profileSnapshot).toBeUndefined();
  });

  it("clearSnapshot removes profileSnapshot and lastWeeklyRollup keys", async () => {
    globalThis.__chromeLocalStore.profileSnapshot = { keep: "no" };
    globalThis.__chromeLocalStore.lastWeeklyRollup = { keep: "no" };
    globalThis.__chromeLocalStore.somethingElse = "untouched";

    const result = await bridge.clearSnapshot();

    expect(result).toBeNull();
    expect(globalThis.__chromeLocalStore.profileSnapshot).toBeUndefined();
    expect(globalThis.__chromeLocalStore.lastWeeklyRollup).toBeUndefined();
    expect(globalThis.__chromeLocalStore.somethingElse).toBe("untouched");
  });

  it("does not call train2goFetch for snapshot actions", async () => {
    const fetchSpy = vi.spyOn(bridge, "train2goFetch");

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
});
