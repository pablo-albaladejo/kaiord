> Completed: 2026-10-10

# Proposal: A default local profile that stays sync-inert until it is claimed

## Why

A clean browser had no athlete profile, and the profile-scoped surfaces
failed without saying why: "Save & schedule" in the editor was disabled with
no reason (F-23), saving wellness reported a generic failure (F-09), and
nutrition and preferences silently did nothing (F-06, journey 24). The user
had to discover `#/athlete` before the app worked.

Creating a profile at boot fixes that, but a naive one would be pushed to
Drive on the first sync and duplicate the athlete on every new device, or
split their data between two profiles.

## What Changes

- On the first open of the database with no profile, the SPA creates exactly
  one profile with a random UUID, named in the browser's language ("My
  profile" / "Mi perfil"), marked `origin: "auto"`, and makes it active. The
  count, put and active-id write share one transaction; the creation runs
  from Dexie's `ready` hook so no other database operation interleaves with
  it. It is fail-open.
- A one-time, dismissible notice links to the athlete page. Dismissing it
  writes a preference, not the profile.
- The profile is **claimed** (`origin: "local"`) on a user edit of the
  profile or its zones, on the first sync against a remote with no real
  profile, and (PR2a) before a backup export, through `claimAutoProfiles`.
- `syncWithCloud` runs `mergeSnapshots → reconcileAutoProfile → import →
push`. With one real remote profile the auto profile's rows are re-keyed
  onto it (`profileId` and every composite id that embeds it), the auto
  profile is removed without a tombstone, and its integration cursors are
  dropped. With several, sync stops before importing or pushing and asks the
  user which profile this device belongs to; the pick is stored in `meta` and
  sync re-runs. With none, the auto profile is claimed and pushed.
- Device-local tables (`connections`, `intakeEntries`, `intakePresets`,
  `energyTargets`) are re-keyed in the same transaction as the import.
- `cloud.push` never receives an `origin: "auto"` profile; the in-memory
  cloud fake throws if it does, so every sync test asserts it.
- `dataTypeSourcePolicy` gets its `[profileId, dataType]` merge key: without
  it every sync collapsed all source policies into one row.
- The remaining no-profile states say why: the schedule button shows its
  reason, wellness reports the missing profile.

## Impact

- Specs: `spa-persistence-port` (two added requirements).
- Code: `packages/workout-spa-editor` only. No Dexie version bump: `origin`
  is an optional, unindexed field.
