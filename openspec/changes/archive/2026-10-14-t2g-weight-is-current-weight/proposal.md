> Completed: 2026-10-14

# Proposal: Train2Go's weight is the current weight

## Why

Since the single current weight (2026-10-13-single-current-weight), the
athlete's weight is the latest weigh-in, with `profile.bodyWeight` only as the
fallback for an athlete who has never weighed in. The Train2Go zones sync
still compared against and wrote `profile.bodyWeight`, so there were two
sources of truth again: a weigh-in of 75 kg and a Train2Go weight of 83 kg
never met, the sync silently filled a profile field the Athlete page no longer
shows, and an athlete with weigh-ins but no profile weight got the Train2Go
weight written behind the weigh-ins.

## What Changes

- The sync reads the weight through `getCurrentWeightKg`, so a conflict
  compares Train2Go against the weight the athlete actually sees.
- A silent fill and an accepted conflict record a weigh-in for today stamped
  `sourceBridgeId: "train2go-bridge"`, the bridge id every other bridge's
  health rows use, so the Data Hub and future dedup never mistake it for a
  typed-in weigh-in. `sourceBridgeId` is a free string column, so no schema
  change is needed.
- Sources never overwrite each other's rows (the multi-source read policy,
  union or priority, decides between them): a same-day write updates only
  Train2Go's own weigh-in of that day and leaves a manual weigh-in untouched.
- A weight equal to Train2Go's own latest weigh-in is not news: re-syncing it
  records nothing and raises no conflict, even if another source weighed in
  since.
- The health source badge names `train2go-bridge` "Train2Go".
- `profile.bodyWeight` is no longer written by `syncZones` or
  `commitConflictResolution`; the threshold accessors drop it.
- `syncZones` and `commitConflictResolution` take the persistence port instead
  of the profile repository, and write the profile and the weigh-in in one
  transaction.

## Impact

- No Dexie schema change.
- The conflict dialog's weight row is unchanged; its "Kaiord" value is now the
  current weight.
