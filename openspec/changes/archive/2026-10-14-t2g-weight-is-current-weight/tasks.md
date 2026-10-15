> Tasks: 7 completed, 0 deferred

# Tasks

- [x] 1. Red first: the sync compares against the latest weigh-in, records an unknown weight as today's weigh-in, and does not duplicate it on re-sync.
- [x] 2. Red first: an accepted weight conflict updates today's weigh-in once, however often it is committed; a rejected one records nothing.
- [x] 3. `syncZones` and `commitConflictResolution` route the weight through `sync-zones-weight.ts`; the profile threshold accessors no longer touch `bodyWeight`.
- [x] 4. E2E: the empty-profile auto-sync records one weigh-in for today and leaves `profile.bodyWeight` unset.
- [x] 5. Red first: the weigh-in is stamped `train2go-bridge`, a same-day manual weigh-in is kept, Train2Go's own row of the day is updated in place, and a weight Train2Go already reported raises no conflict; the source badge names it.
- [x] 6. Red first: the latest of two same-day weigh-ins is the most recent measurement in either storage order; an accepted Train2Go weight is current over an earlier manual weigh-in; a later manual edit wins; today's manual weigh-in carries the real time.
- [x] 7. Red first: a manual save leaves another source's same-day weigh-in untouched; a profile edit saved during the fetch is kept; the profile accessors refuse the weight.
