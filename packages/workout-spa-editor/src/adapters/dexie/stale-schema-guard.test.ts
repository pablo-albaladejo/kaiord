import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DECLARED_VERNO, KaiordDatabase } from "./dexie-database";
import { isNewerSchema } from "./schema-probe";
import { onStaleSchema, StaleSchemaError } from "./stale-schema-guard";

const NEWER = 380;
const PATCHED = 371;
let name = "";
let counter = 0;
let stopListening: () => void = () => undefined;
const staleEvents: number[] = [];

const installRaw = (version: number): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => request.result.createObjectStore("other");
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });

const upgradeFromAnotherTab = (version: number): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

beforeEach(() => {
  counter += 1;
  name = `stale-guard-${counter}`;
  staleEvents.length = 0;
  stopListening = onStaleSchema((version) => staleEvents.push(version));
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  stopListening();
  vi.restoreAllMocks();
});

describe("stale-schema ready gate", () => {
  it("should reject open, queued queries and later subscribers on a newer database", async () => {
    // Arrange
    await installRaw(NEWER);
    const db = new KaiordDatabase(name);
    const laterSubscriber = vi.fn();
    const vipSubscriber = vi.fn(() => Dexie.vip(async () => undefined));
    db.on("ready", laterSubscriber);
    db.on("ready", vipSubscriber, true);

    // Act
    const opened = db.open();
    const queued = db.table("profiles").count();

    // Assert
    await expect(opened).rejects.toBeInstanceOf(StaleSchemaError);
    // Dexie closes on a failed open; a queued query carries the cause.
    const queuedError = await queued.catch((error: unknown) => error);
    expect(queuedError).toBeInstanceOf(Dexie.DatabaseClosedError);
    expect((queuedError as { inner?: unknown }).inner).toBeInstanceOf(
      StaleSchemaError
    );
    expect(laterSubscriber).not.toHaveBeenCalled();
    expect(vipSubscriber).not.toHaveBeenCalled();
    expect(staleEvents).toHaveLength(1);
    db.close();
  });

  it("should open a schema-patched database of the declared major", async () => {
    // Arrange
    await installRaw(PATCHED);
    const db = new KaiordDatabase(name);
    const laterSubscriber = vi.fn();
    db.on("ready", laterSubscriber);

    // Act
    await db.open();

    // Assert
    // Opening may patch the schema again; it stays in the declared major.
    expect(isNewerSchema(db.backendDB().version, DECLARED_VERNO)).toBe(false);
    expect(laterSubscriber).toHaveBeenCalledTimes(1);
    expect(staleEvents).toEqual([]);
    db.close();
  });
});

describe("stale-schema versionchange override", () => {
  it("should close without auto-reopen when another tab upgrades to a newer major", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();

    const reopen = vi.spyOn(db, "open");

    // Act
    const other = await upgradeFromAnotherTab(NEWER);
    const next = db.table("profiles").count();

    // Assert
    await expect(next).rejects.toBeInstanceOf(Dexie.DatabaseClosedError);
    // Auto-open stayed off: Dexie never even tried to reopen.
    expect(reopen).not.toHaveBeenCalled();
    expect(staleEvents).toEqual([NEWER]);
    other.close();
  });

  it("should keep close-and-reopen when another tab deletes the database", async () => {
    // Arrange
    const db = new KaiordDatabase(name);
    await db.open();

    // Act
    await new Promise((resolve) => {
      indexedDB.deleteDatabase(name).onsuccess = resolve;
    });
    const count = await db.table("profiles").count();

    // Assert
    expect(count).toBe(0);
    expect(db.isOpen()).toBe(true);
    expect(staleEvents).toEqual([]);
    db.close();
  });
});
