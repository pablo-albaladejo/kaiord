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
- The current weight is the most recent measurement: `latestUpTo` orders
  same-day weigh-ins by `measuredAt`, then by id, instead of by storage order
  (Dexie returns same-day rows by random UUID, so an accepted Train2Go weight
  lost to an earlier manual weigh-in about half the time). The Train2Go
  weigh-in and today's manual weigh-in carry the real time they were taken; a
  past day's manual weigh-in keeps noon.
- A manual save reuses only the day's manual row and never re-stamps another
  source's row as manual. Steps stays the exception: it merges into the day's
  daily row so imported calories survive.
- `syncZones` and `commitConflictResolution` read the profile inside the
  transaction that writes it, so an edit saved during the Train2Go fetch is
  kept.
- The Data Hub offers no `weight ← train2go-bridge` route: Train2Go announces
  no `read:body` capability, and the supported-route table only narrows a
  bridge's tokens, it cannot add one. The zones-sync toggle is the only gate.
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
