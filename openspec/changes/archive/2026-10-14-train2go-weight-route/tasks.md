> Tasks: 6 completed, 0 deferred

# Tasks

- [x] 1. Red first: the train2go-bridge manifest, ping, announcement and popup chips include `read:body` / Weight; `background.js` and `bridge-identity.js` change together.
- [x] 2. Red first: `bridgeSupportsRoute` narrows `train2go-bridge` to planned-session, training-zones and weight; the real-manifest parity test makes weight the only `read:body` type it is eligible for.
- [x] 3. Red first: `syncZones` and `commitConflictResolution` record no Train2Go weigh-in, and raise no weight conflict, when the weight route is off; with the route on or absent they behave as before.
- [x] 4. Red first: linking a Train2Go that announces `read:body` seeds the weight route; Train2Go can be ranked first for weight.
- [x] 5. E2E: Connections offers the Train2Go weight route only when the extension announces `read:body`; a zones sync with the weight route off records no weigh-in.
- [x] 6. Changesets: minor for `@kaiord/train2go-bridge` and `@kaiord/workout-spa-editor`.
