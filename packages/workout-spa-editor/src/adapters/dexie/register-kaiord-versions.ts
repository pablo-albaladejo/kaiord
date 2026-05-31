/**
 * Kaiord Dexie Version Registration
 *
 * Wires every schema version + upgrade onto a Dexie instance. Extracted
 * from `KaiordDatabase` so the constructor stays under the per-function
 * line cap. v10+ registrations live in `register-kaiord-versions-v10-plus.ts`
 * so this file stays under the per-file line cap as history grows.
 */

import type Dexie from "dexie";

import {
  applyV8Upgrade,
  applyV9Upgrade,
  backfillBridgeSnapshotState,
  backfillUsageRow,
} from "./dexie-migrations";
import { backfillLinkedAccounts, SCHEMAS } from "./dexie-schemas";
import {
  registerV10ToV12,
  registerV13ToV16,
  registerV17,
  registerV18,
  registerV19,
} from "./register-kaiord-versions-v10-plus";

// Narrowed handle: only `version()` is needed and Dexie's full surface
// causes "Type instantiation is excessively deep" when passed as a
// param across module boundaries. The runtime value is always a
// `KaiordDatabase`/`Dexie` instance.
type DexieVersionHost = Pick<Dexie, "version">;

const registerV1ToV3 = (db: DexieVersionHost): void => {
  db.version(1).stores(SCHEMAS.v1);
  db.version(2).stores(SCHEMAS.v2);
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
  // v5 — session-match + user-preferences + auto-match-dismissals.
  db.version(5).stores(SCHEMAS.v5);
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
  registerV1ToV3(db);
  registerV4ToV6(db);
  registerV7ToV9(db);
  registerV10ToV12(db);
  registerV13ToV16(db);
  registerV17(db);
  registerV18(db);
  registerV19(db);
};
