import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isNewerSchema, probeSchema } from "./schema-probe";

const DECLARED = 37;
// Native versions are `verno * 10`; schema patching adds one within a major.
const CURRENT = 370;
const PATCHED = 371;
const TOP_OF_MAJOR = 379;
const NEWER = 380;
const NEWEST = 390;
let dbName = "";
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
});
