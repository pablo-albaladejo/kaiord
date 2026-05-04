/**
 * train2go-extension-read-zones — wire-fetch test for the `read-details`
 * action. Covers envelope shape, transport error, AbortSignal short-
 * circuit, and the shared `OperationQueue` counter contract that
 * `readZones` and `readWeek/readDay/snapshot-push` will eventually all
 * count against.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createOperationQueue } from "../adapters/bridge/operation-queue";
import { readZones } from "./train2go-extension-read-zones";

const setupChrome = (
  cb: (msg: unknown, cb: (r: unknown) => void) => void
): void => {
  (globalThis as Record<string, unknown>).chrome = {
    runtime: {
      lastError: null,
      sendMessage: vi.fn(
        (_id: string, msg: unknown, cb2: (r: unknown) => void) => cb(msg, cb2)
      ),
    },
  };
};

describe("readZones", () => {
  beforeEach(() => {
    setupChrome((_msg, cb) => cb({ ok: true, data: {} }));
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).chrome;
  });

  it("should send a read-details action with externalUserId payload", async () => {
    // Arrange
    const sent: unknown[] = [];
    setupChrome((msg, cb) => {
      sent.push(msg);
      cb({ ok: true, data: { physiological: { weight: 83 } } });
    });
    const queue = createOperationQueue(0);

    // Act
    const res = await readZones("ext-id", "99999", queue);

    // Assert
    expect(res.ok).toBe(true);
    expect(sent).toEqual([{ action: "read-details", externalUserId: "99999" }]);
  });

  it("should return the bridge envelope verbatim on transport failure", async () => {
    // Arrange
    setupChrome((_msg, cb) => cb({ ok: false, error: "No Train2Go tab open" }));
    const queue = createOperationQueue(0);

    // Act
    const res = await readZones("ext-id", "99999", queue);

    // Assert
    expect(res).toEqual({ ok: false, error: "No Train2Go tab open" });
  });

  it("should short-circuit with Aborted when signal is already aborted", async () => {
    // Arrange
    const ac = new AbortController();
    ac.abort();
    const queue = createOperationQueue(0);

    // Act
    const res = await readZones("ext-id", "99999", queue, ac.signal);

    // Assert
    expect(res).toEqual({ ok: false, error: "Aborted" });
  });

  it("should do NOT consume a queue slot when aborted pre-call", async () => {
    // Arrange
    const ac = new AbortController();
    ac.abort();
    const queue = createOperationQueue(0);

    // Act
    await readZones("ext-id", "99999", queue, ac.signal);

    // Assert
    expect(queue.getHourlyCount("ext-id")).toBe(0);
  });

  it("should count against the queue's per-bridge hourly counter on success", async () => {
    // Arrange
    const queue = createOperationQueue(0);

    // Act
    await readZones("ext-id", "99999", queue);

    // Assert
    expect(queue.getHourlyCount("ext-id")).toBe(1);
  });

  it("should share the same per-bridge counter across any future queue consumer", async () => {
    // Arrange
    const queue = createOperationQueue(0);
    const now = Date.now();
    const arr = Array.from({ length: 59 }, (_, i) => now - 1000 - i);
    queue._timestamps.set("ext-id", arr);

    // Act
    const res = await readZones("ext-id", "99999", queue);

    // Assert
    expect(res.ok).toBe(true);
    expect(queue.getHourlyCount("ext-id")).toBe(60);
  });

  it("should reject the 61st op within the rolling hour", async () => {
    // Arrange
    const queue = createOperationQueue(0);
    const now = Date.now();
    const arr = Array.from({ length: 60 }, (_, i) => now - 1000 - i);

    // Act
    queue._timestamps.set("ext-id", arr);

    // Assert
    await expect(readZones("ext-id", "99999", queue)).rejects.toThrow(
      /Rate limit reached/
    );
  });
});
