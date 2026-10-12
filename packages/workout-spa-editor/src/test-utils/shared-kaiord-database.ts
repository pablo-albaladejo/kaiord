/**
 * One `KaiordDatabase` instance for a whole test file (or describe block),
 * with a brand-new IndexedDB database behind it in every test.
 *
 * Constructing a `KaiordDatabase` registers every schema version, and Dexie
 * re-parses all earlier versions on each `stores()` call, so construction
 * costs ~45 ms of CPU on a quiet machine. Building it per test made it most
 * of the work in the Dexie-backed test files.
 *
 * Isolation is not hand-written table clearing: `afterEach` drops the whole
 * database, so the next test's first query (or explicit `open()`) creates it
 * from scratch on the fresh-install path, exactly like a new instance would.
 * `beforeEach` fails the test if the previous database is still there.
 *
 * Call it at file or describe scope, never inside a test. Per-instance state
 * (Dexie hooks, `db.on(...)` listeners, spies on the instance) outlives a test,
 * so a file that installs any of those per test must not share the instance.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach } from "vitest";

import { KaiordDatabase } from "../adapters/dexie/dexie-database";

/** Rejects when `db`'s database already exists, i.e. a test would not start fresh. */
export const assertFreshDatabase = async (db: Dexie): Promise<void> => {
  if (db.isOpen() || (await Dexie.exists(db.name))) {
    throw new Error(
      `Test database "${db.name}" survived the previous test; ` +
        "every test must start from a freshly created database."
    );
  }
};

export const sharedKaiordDatabase = (label: string): KaiordDatabase => {
  const db = new KaiordDatabase(
    `kaiord-test-${label}-${Date.now()}-${Math.random()}`
  );
  beforeEach(() => assertFreshDatabase(db));
  afterEach(async () => {
    // Keep auto-open on, as on a newly constructed instance.
    await db.delete({ disableAutoOpen: false });
  });
  return db;
};
