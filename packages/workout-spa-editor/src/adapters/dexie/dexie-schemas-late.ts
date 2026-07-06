/**
 * Latest Dexie schema versions (v24+), split out of `dexie-schemas.ts` so that
 * file stays under the per-file line cap as the migration history grows. Each
 * builder spreads the previous version's store map (passed in) to keep the
 * "additive, no rewrite" invariant explicit and avoid a circular import.
 */

type Stores = Record<string, string>;

// v22 — additive `aiModelBindings` store for per-profile model bindings.
// Composite PK `[profileId+purpose]` keeps one row per purpose per profile;
// the `profileId` index drives the cascade and makes the table a cascade
// target (also auto-discovered by `isPerProfileTable`). Moved here (rather
// than dexie-schemas.ts, where it originated) to keep that file under the
// per-file line cap.
export const buildCoreV22 = (prev: Stores): Stores => ({
  ...prev,
  aiModelBindings: "[profileId+purpose], profileId",
});

// v24 — additive `connections` store for per-(profile, provider) account
// linkage (#714). PK `[profileId+providerId]`; the `profileId` index drives the
// profile-delete cascade and makes `isPerProfileTable` auto-discover it. Dexie
// auto-creates the store empty on upgrade — no data transform. The store is
// deliberately excluded from the cloud snapshot (credentials stay device-local).
export const buildCoreV24 = (prev: Stores): Stores => ({
  ...prev,
  connections: "[profileId+providerId], profileId",
});

// v26 — additive energy-balance stores (energy-balance-tracking, Phase 0).
// `intakeEntries` keys on a nanoid `id` with a `[profileId+date]` index for the
// per-day intake roll-up; `intakePresets` keys on `id` with a `profileId` index
// for the per-profile preset list; `energyTargets` keys on `profileId` so there
// is exactly one active goal per profile. All three are device-local PII,
// auto-created empty on upgrade, and excluded from the cloud snapshot (see
// dexie-snapshot-port DEVICE_LOCAL).
export const buildCoreV26 = (prev: Stores): Stores => ({
  ...prev,
  intakeEntries: "id, [profileId+date]",
  intakePresets: "id, profileId",
  energyTargets: "profileId",
});

// v27 — Data Hub domain tables. `plannedSessions` receives the migrated
// `coachingActivities` rows (ids preserved, same index shape) so the routable
// unit is the individual coach-prescribed session. `activities` is the
// executed-session store, auto-created empty until the FIT-import classifier
// and the Garmin activity pull (F5) populate it. `coachingActivities` is
// retained this version for reversibility (see dexie-v27-migration).
export const buildCoreV27 = (prev: Stores): Stores => ({
  ...prev,
  plannedSessions:
    "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
  // `activities` dedups by provenance (sourceBridgeId, externalId) mirroring
  // the health stores, so a re-imported FIT file (same content-hash) is a
  // no-op; `[profileId+date]` drives calendar reads and the profile cascade.
  activities: "id, [profileId+date], [profileId+sourceBridgeId+externalId]",
});

// v30 — additive `dataTypeSourcePolicy` companion table (F3.1): per-(profile,
// dataType) multi-source semantics (union|priority + sourceOrder), consumed by
// resolveEffectiveSource (F3.2). PK is the compound `[profileId+dataType]` —
// exactly one row per type per profile; the `profileId` index drives the
// profile-delete cascade. Auto-created empty on upgrade: no row means the
// implicit "union" default, so there is nothing to seed.
export const buildCoreV30 = (prev: Stores): Stores => ({
  ...prev,
  dataTypeSourcePolicy: "[profileId+dataType], profileId",
});
