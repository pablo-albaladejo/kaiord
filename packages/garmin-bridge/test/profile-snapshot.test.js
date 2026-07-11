import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "./chrome-mock.js";
import { validateSnapshot } from "../profile-snapshot.js";
import {
  positiveSnapshotFixtures,
  negativeSnapshotFixtures,
} from "@kaiord/core/test-utils";

// Load background.js via require (not import) to match background.test.js.
// A require/import split loads background.js as two module instances, which
// makes the v8 per-function coverage merge non-deterministic (Functions
// oscillated 58%↔86% across identical runs). Unifying on require collapses
// it to a single instrumented instance and stabilises coverage.
const bridge = require("../background.js");

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
      error: "Origin or action not permitted",
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
      expect.objectContaining({
        ok: false,
        error: "Origin or action not permitted",
      })
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

  it("should origin-gate every external action, not only snapshot writes", async () => {
    // Arrange
    const sendResponse = vi.fn();

    // Act
    bridge.handleExternalMessage(
      { action: "open-garmin" },
      { origin: "anything" },
      sendResponse
    );

    await new Promise((r) => setTimeout(r, 10));

    // Assert
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: "Origin or action not permitted",
      })
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
