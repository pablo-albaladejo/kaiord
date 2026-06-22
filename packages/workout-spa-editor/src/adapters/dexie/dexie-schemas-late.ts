/**
 * Latest Dexie schema versions (v24+), split out of `dexie-schemas.ts` so that
 * file stays under the per-file line cap as the migration history grows. Each
 * builder spreads the previous version's store map (passed in) to keep the
 * "additive, no rewrite" invariant explicit and avoid a circular import.
 */

type Stores = Record<string, string>;

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
