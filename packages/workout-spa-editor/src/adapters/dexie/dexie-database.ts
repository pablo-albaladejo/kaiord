/**
 * Dexie Database Schema
 *
 * IndexedDB database definition for the workout SPA editor.
 * Uses Dexie.js class syntax (required by the library).
 */

import Dexie from "dexie";

import {
  applyV8Upgrade,
  backfillBridgeSnapshotState,
  backfillUsageRow,
} from "./dexie-migrations";

export {
  backfillBridgeSnapshotState,
  backfillUsageRow,
  makeBackfillAiProviderCreatedAt,
} from "./dexie-migrations";

const CORE_V1 = {
  workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
  templates: "id, sport, *tags",
  profiles: "id",
  aiProviders: "id",
  syncState: "source",
  usage: "yearMonth",
  meta: "key",
};
const CORE_V2 = { ...CORE_V1, bridges: "extensionId, status, lastSeen" };
const CORE_V4 = {
  ...CORE_V2,
  coachingActivities:
    "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
  coachingSyncState: "[source+profileId], source, profileId",
};
const CORE_V5 = {
  ...CORE_V4,
  // PK is `id` (nanoid). Indexes support all spec-mandated queries:
  //   - [profileId+coachingActivityId] / [profileId+workoutId]: uniqueness checks
  //   - [profileId+date]: weekly listByProfileAndWeek
  //   - coachingActivityId / workoutId: cascade hooks
  //   - profileId: profile-delete cascade
  sessionMatches:
    "id, [profileId+coachingActivityId], [profileId+workoutId], [profileId+date], coachingActivityId, workoutId, profileId",
  // PK is `profileId` (one row per profile, lazy creation).
  userPreferences: "profileId",
  // PK is composite `[profileId+weekStart]`; index on profileId for cascade.
  autoMatchDismissals: "[profileId+weekStart], profileId",
};
// v8 — AI provider insertion-order index. `createdAt` becomes a Dexie
// index so the repository's getAll can `orderBy("createdAt")` cheaply.
// PK stays on `id`; the index is additive.
const CORE_V8 = { ...CORE_V5, aiProviders: "id, createdAt" };

const backfillLinkedAccounts = (row: Record<string, unknown>): void => {
  if (!Array.isArray(row.linkedAccounts)) row.linkedAccounts = [];
};

export class KaiordDatabase extends Dexie {
  constructor(name = "kaiord-spa") {
    super(name);
    this.version(1).stores(CORE_V1);
    this.version(2).stores(CORE_V2);
    this.version(3)
      .stores(CORE_V2)
      .upgrade(async (tx) => {
        await tx.table("usage").toCollection().modify(backfillUsageRow);
      });
    // v4 — coaching integration. Bridge-discovery syncState is byte-
    // identically unchanged; coachingActivities + coachingSyncState are
    // new; existing profiles are backfilled with linkedAccounts: [].
    this.version(4)
      .stores(CORE_V4)
      .upgrade(async (tx) => {
        await tx
          .table("profiles")
          .toCollection()
          .modify(backfillLinkedAccounts);
      });
    // v5 — session-match + user-preferences + auto-match-dismissals.
    // All new tables are empty on first load; no existing rows are mutated.
    // Forward-only: opening an older bundle against a v5 DB raises VersionError.
    this.version(5).stores(CORE_V5);
    // v6 — bridge profile-snapshot push: backfills `pendingClear: false`
    // and `lastSuccessfulFingerprint: null` on existing bridge rows so
    // the snapshot pusher's de-dup and right-to-be-forgotten paths can
    // assume well-defined state. Stores config is unchanged (the new
    // fields are non-indexed); the upgrade only touches data.
    this.version(6)
      .stores(CORE_V5)
      .upgrade(async (tx) => {
        await tx
          .table("bridges")
          .toCollection()
          .modify(backfillBridgeSnapshotState);
      });
    // v7 — autoMatchDismissals row shape switched from a single
    // `dismissedAt` timestamp to a per-pair `dismissedPairs: Array<{
    // activityId, workoutId, dismissedAt }>` (per design D15 of
    // calendar-coaching-redesign-completion). The table is UX-state
    // cache, not user data, so the migration clears it forward-only —
    // simpler than a row-by-row reshape and avoids carrying any
    // legacy code path in the adapter. Users see the banner re-surface
    // once after upgrade for any week where they had previously
    // dismissed it; subsequent dismissals are recorded in the new
    // shape.
    this.version(7)
      .stores(CORE_V5)
      .upgrade(async (tx) => {
        await tx.table("autoMatchDismissals").clear();
      });
    // v8 — AI provider insertion-order. Adds a `createdAt` index on
    // aiProviders and backfills the field on legacy rows so getAll()'s
    // orderBy is stable. Without this, providers were ordered by their
    // randomly-assigned UUIDs — a deterministic but probabilistic flake
    // visible to users (selector reorders) and to E2E tests.
    this.version(8).stores(CORE_V8).upgrade(applyV8Upgrade);
  }
}

export const db = new KaiordDatabase();

// Expose for e2e test seeding (dev mode only)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__KAIORD_DB__ = db;
}
