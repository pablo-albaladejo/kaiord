/**
 * Dexie transaction runner.
 *
 * Dexie's transaction overload resolution explodes against KaiordDatabase's
 * table union (TS2589 — see dexie-profile-repository.ts). Narrow to a single
 * explicit signature so the application-facing port stays strongly typed while
 * the adapter sidesteps the inference depth.
 */

import type { KaiordDatabase } from "./dexie-database";

type DexieTxScope = (
  mode: "rw",
  tables: ReadonlyArray<unknown>,
  scope: () => Promise<unknown>
) => Promise<unknown>;

export function createTransactionRunner(database: KaiordDatabase) {
  return <T>(fn: () => Promise<T>): Promise<T> => {
    const dexie = database as unknown as {
      transaction: DexieTxScope;
      tables: ReadonlyArray<unknown>;
    };
    // Atomicity: on rejection the IDB transaction aborts and all writes inside
    // `fn` roll back. See PersistencePort.transaction for the rule.
    return dexie.transaction("rw", dexie.tables, fn) as unknown as Promise<T>;
  };
}
