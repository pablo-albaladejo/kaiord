import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isNewerSchema, PROBE_DEADLINE_MS, probeSchema } from "./schema-probe";

const DECLARED = 37;
// Native versions are `verno * 10`; schema patching adds one within a major.
const CURRENT = 370;
const PATCHED = 371;
const TOP_OF_MAJOR = 379;
const NEWER = 380;
const NEWEST = 390;
let dbName = "";

type SilentRequest = {
  result?: { version: number; close: () => void };
  transaction: { abort: () => void } | null;
  onsuccess?: () => void;
  onupgradeneeded?: (event: { oldVersion: number }) => void;
};

// An open that only answers when the test says so.
const silentFactory = (request: SilentRequest) =>
  ({ open: () => request }) as unknown as IDBFactory;
let counter = 0;

const openAt = (name: string, version: number): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("rows")) db.createObjectStore("rows");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

// No version: a database that was destroyed comes back empty at v1.
const reopen = (name: string): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const installedNames = async (): Promise<string[]> =>
  (await indexedDB.databases()).map((info) => info.name ?? "");

describe("isNewerSchema", () => {
  it.each([
    [CURRENT, false],
    [PATCHED, false],
    [TOP_OF_MAJOR, false],
    [NEWER, true],
  ])(
    "should rate native %i against declared 37 as newer=%s",
    (native, newer) => {
      // Arrange
      const declared = DECLARED;

      // Act
      const result = isNewerSchema(native, declared);

      // Assert
      expect(result).toBe(newer);
    }
  );
});

describe("probeSchema", () => {
  beforeEach(() => {
    counter += 1;
    dbName = `schema-probe-${counter}`;
    vi.spyOn(indexedDB, "deleteDatabase");
  });

  afterEach(() => {
    // Nothing on the probe path may delete a database.
    expect(indexedDB.deleteDatabase).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("should report an absent database as absent and leave none behind", async () => {
    // Arrange
    const before = await installedNames();

    // Act
    const result = await probeSchema(dbName, DECLARED);

    // Assert
    expect(before).not.toContain(dbName);
    expect(result).toEqual({ status: "absent" });
    expect(await installedNames()).not.toContain(dbName);
  });

  it("should let an open queued behind the probe create the database", async () => {
    // Arrange
    const probing = probeSchema(dbName, DECLARED);

    // Act
    const app = await openAt(dbName, CURRENT);
    const result = await probing;
    app.close();
    // Anything the probe queued against the database runs once the app lets
    // go of it; a reopen queues behind that and sees what survived.
    const reopened = await reopen(dbName);

    // Assert
    expect(result).toEqual({ status: "absent" });
    expect(app.version).toBe(CURRENT);
    expect(reopened.version).toBe(CURRENT);
    expect([...reopened.objectStoreNames]).toEqual(["rows"]);
    reopened.close();
  });

  it("should report a database of a newer major as stale and close", async () => {
    // Arrange
    (await openAt(dbName, NEWER)).close();

    // Act
    const result = await probeSchema(dbName, DECLARED);
    const upgraded = await openAt(dbName, NEWEST);

    // Assert
    expect(result).toEqual({ status: "stale", nativeVersion: NEWER });
    expect(upgraded.version).toBe(NEWEST);
    upgraded.close();
  });

  it("should report a schema-patched database as fresh", async () => {
    // Arrange
    (await openAt(dbName, PATCHED)).close();

    // Act
    const result = await probeSchema(dbName, DECLARED);

    // Assert
    expect(result).toMatchObject({ status: "fresh", nativeVersion: PATCHED });
    if (result.status === "fresh") result.release();
  });

  it("should close a held probe when another opener upgrades", async () => {
    // Arrange
    (await openAt(dbName, CURRENT)).close();
    const result = await probeSchema(dbName, DECLARED);

    // Act
    const upgraded = await openAt(dbName, NEWER);

    // Assert
    expect(result.status).toBe("fresh");
    expect(upgraded.version).toBe(NEWER);
    upgraded.close();
  });

  it("should report unknown when IndexedDB is unavailable", async () => {
    // Arrange
    const throwing = {
      open: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    } as unknown as IDBFactory;

    // Act
    const missing = await probeSchema(dbName, DECLARED, null);
    const blocked = await probeSchema(dbName, DECLARED, throwing);

    // Assert
    expect(missing).toEqual({ status: "unknown" });
    expect(blocked).toEqual({ status: "unknown" });
  });

  it("should report unknown at the deadline and close a late connection", async () => {
    // Arrange
    vi.useFakeTimers();
    const request: SilentRequest = { transaction: null };
    const probe = probeSchema(dbName, DECLARED, silentFactory(request));

    // Act
    await vi.advanceTimersByTimeAsync(PROBE_DEADLINE_MS);
    const result = await probe;
    const close = vi.fn();
    request.result = { version: CURRENT, close };
    request.onsuccess?.();
    vi.useRealTimers();

    // Assert
    expect(result).toEqual({ status: "unknown" });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("should still abort an upgrade that arrives after the deadline", async () => {
    // Arrange
    vi.useFakeTimers();
    const abort = vi.fn();
    const request: SilentRequest = { transaction: { abort } };
    const probe = probeSchema(dbName, DECLARED, silentFactory(request));

    // Act
    await vi.advanceTimersByTimeAsync(PROBE_DEADLINE_MS);
    request.onupgradeneeded?.({ oldVersion: 0 });
    const result = await probe;
    vi.useRealTimers();

    // Assert
    expect(result).toEqual({ status: "unknown" });
    expect(abort).toHaveBeenCalledTimes(1);
  });
});
