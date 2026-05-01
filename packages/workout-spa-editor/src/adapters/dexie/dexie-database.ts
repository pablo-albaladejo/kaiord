/**
 * Dexie Database Schema
 *
 * IndexedDB database definition for the workout SPA editor.
 * Uses Dexie.js class syntax (required by the library).
 */

import Dexie from "dexie";

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
  }
}

export function backfillUsageRow(row: Record<string, unknown>): void {
  if (typeof row.inputTokens === "number") return;
  const total = typeof row.totalTokens === "number" ? row.totalTokens : 0;
  row.inputTokens = total;
  row.outputTokens = 0;
  row.legacy = true;

  if (Array.isArray(row.entries)) {
    row.entries = row.entries.map((entry: Record<string, unknown>) => {
      if (typeof entry.inputTokens === "number") return entry;
      const tokens = typeof entry.tokens === "number" ? entry.tokens : 0;
      return { ...entry, inputTokens: tokens, outputTokens: 0 };
    });
  }
}

export const db = new KaiordDatabase();

// Expose for e2e test seeding (dev mode only)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__KAIORD_DB__ = db;
}
