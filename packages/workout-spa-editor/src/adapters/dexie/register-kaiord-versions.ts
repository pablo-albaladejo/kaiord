/**
 * Kaiord Dexie Version Registration
 *
 * Wires the schema versions + upgrades onto a Dexie instance. Extracted
 * from `KaiordDatabase` so the constructor stays under the per-function
 * line cap. v10+ registrations live in `register-kaiord-versions-v10-plus.ts`
 * so this file stays under the per-file line cap as history grows.
 *
 * Pruned history: only versions with an upgrade function, plus the head, are
 * declared. Dexie >= 3 diffs from the INSTALLED schema to each declared
 * version above the user's one (dexie.mjs `updateTablesAndIndexes`), so a
 * user on a schema-only version that is no longer declared (1, 2, 5, 16,
 * 18–21, 23, 24, 26, 30–32, 34, 35) goes straight to the next kept version,
 * whose declaration restates every store in full. Dexie re-parses every
 * earlier version on each `stores()` call, so each declaration costs startup
 * time. Rules: never remove or edit a version with an upgrade function; a
 * schema-only version may be pruned once a later kept version restates it.
 * `kaiord-schema-history*.test.ts` enforces both against a frozen history.
 */

import type Dexie from "dexie";

import { backfillLinkedAccounts } from "./dexie-backfill-linked-accounts";
import {
  applyV8Upgrade,
  applyV9Upgrade,
  backfillBridgeSnapshotState,
  backfillUsageRow,
} from "./dexie-migrations";
import { SCHEMAS } from "./dexie-schemas";
import {
  registerV10ToV12,
  registerV13ToV15,
  registerV17,
  registerV22,
  registerV25,
  registerV27,
  registerV28,
  registerV29,
} from "./register-kaiord-versions-v10-plus";

// Narrowed handle: only `version()` is needed and Dexie's full surface
// causes "Type instantiation is excessively deep" when passed as a
// param across module boundaries. The runtime value is always a
// `KaiordDatabase`/`Dexie` instance.
type DexieVersionHost = Pick<Dexie, "version">;

const registerV3 = (db: DexieVersionHost): void => {
  // v1 (base stores) and v2 (`bridges`) are schema-only: pruned, restated
  // by v3's SCHEMAS.v2.
  db.version(3)
    .stores(SCHEMAS.v2)
    .upgrade(async (tx) => {
      await tx.table("usage").toCollection().modify(backfillUsageRow);
    });
};

const registerV4ToV6 = (db: DexieVersionHost): void => {
  // v4 — coaching integration. New tables; existing profiles backfilled
  // with linkedAccounts: [].
  db.version(4)
    .stores(SCHEMAS.v4)
    .upgrade(async (tx) => {
      await tx.table("profiles").toCollection().modify(backfillLinkedAccounts);
    });
  // v5 — session-match + user-preferences + auto-match-dismissals. Schema
  // only: pruned, restated by v6's SCHEMAS.v5.
  // v6 — bridge profile-snapshot push: backfills snapshot-pusher state.
  db.version(6)
    .stores(SCHEMAS.v5)
    .upgrade(async (tx) => {
      await tx
        .table("bridges")
        .toCollection()
        .modify(backfillBridgeSnapshotState);
    });
};

const registerV7ToV9 = (db: DexieVersionHost): void => {
  // v7 — autoMatchDismissals reshape (D15 of calendar-coaching-redesign).
  // UX-state cache, not user data: cleared forward-only.
  db.version(7)
    .stores(SCHEMAS.v5)
    .upgrade(async (tx) => {
      await tx.table("autoMatchDismissals").clear();
    });
  // v8 — AI provider insertion-order. Adds `createdAt` index +
  // backfills legacy rows so getAll() orderBy is stable.
  db.version(8).stores(SCHEMAS.v8).upgrade(applyV8Upgrade);
  // v9 — zone-method-aware reconcile prep (data-only upgrade).
  db.version(9).stores(SCHEMAS.v8).upgrade(applyV9Upgrade);
};

export const registerKaiordVersions = (db: DexieVersionHost): void => {
  registerV3(db);
  registerV4ToV6(db);
  registerV7ToV9(db);
  registerV10ToV12(db);
  registerV13ToV15(db);
  registerV17(db);
  registerV22(db);
  registerV25(db);
  registerV27(db);
  registerV28(db);
  registerV29(db);
};
