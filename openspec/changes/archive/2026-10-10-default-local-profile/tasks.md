> Tasks: 9 completed, 0 deferred

# Tasks

## 1. Creation

- [x] 1.1 `ensureDefaultProfile`: one transaction (count, put, set active),
      idempotent, fail-open; two-tab race test.
- [x] 1.2 Run it from Dexie's `ready` hook with a localized name; test that a
      clear-and-reseed queued during open never interleaves.
- [x] 1.3 Dismissible first-run notice that does not claim the profile.

## 2. Claim

- [x] 2.1 Claim on profile and zone edits (the two updater chokepoints) and
      expose `claimAutoProfiles` for the backup export.

## 3. Sync

- [x] 3.1 Pure `reconcileAutoProfile` with per-table re-key rules and
      collision tests; coverage guard over the live Dexie schema.
- [x] 3.2 `attempt()` order merge → reconcile → import → push; retry after a
      moved revision; device-local re-key atomic with the import.
- [x] 3.3 `needsChoice`: no import, no push; stored choice; selector banner.
- [x] 3.4 In-memory cloud rejects any pushed `origin: "auto"` profile.

## 4. Surfaces

- [x] 4.1 No silent gates: schedule reason, wellness toast; e2e from a clean
      browser covering schedule, wellness, nutrition and preferences.
