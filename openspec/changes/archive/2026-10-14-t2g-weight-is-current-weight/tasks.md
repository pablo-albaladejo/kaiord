> Tasks: 4 completed, 0 deferred

# Tasks

- [x] 1. Red first: the sync compares against the latest weigh-in, records an unknown weight as today's weigh-in, and does not duplicate it on re-sync.
- [x] 2. Red first: an accepted weight conflict updates today's weigh-in once, however often it is committed; a rejected one records nothing.
- [x] 3. `syncZones` and `commitConflictResolution` route the weight through `sync-zones-weight.ts`; the profile threshold accessors no longer touch `bodyWeight`.
- [x] 4. E2E: the empty-profile auto-sync records one weigh-in for today and leaves `profile.bodyWeight` unset.
