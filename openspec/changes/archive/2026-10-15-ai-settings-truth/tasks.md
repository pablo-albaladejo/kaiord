> Tasks: 10 completed, 0 deferred

# Tasks

- [x] 1. Red first: `resolveModelForPurpose` keeps a binding's provider and runs its model when the bound model is blank or whitespace.
- [x] 2. Red first: `setModelBinding` rejects a blank model id and stores nothing; `removeProvider` deletes every athlete's bindings that pointed at the provider.
- [x] 3. Red first: each model row shows the effective resolution, and a purpose without its own binding says it follows the main model, naming it.
- [x] 4. Red first: provider rows show the key's last four characters only, the edit field opens empty, a label-only edit keeps the key, and Remove asks for confirmation.
- [x] 5. Red first: the Settings index names the account the main model runs on.
- [x] 6. E2E with every provider host blocked (keys saved unverified): running model, one main model, no blank model stored, masked key, confirmed removal that takes its bindings.
- [x] 7. Changesets: patch for `@kaiord/ai` and `@kaiord/workout-spa-editor`.
- [x] 8. Red first: clearing a binding or removing its provider records an `aiModelBindings` tombstone `<profileId>:<purpose>`; a cross-device merge or import does not bring the binding back, and a later re-set still wins.
- [x] 9. Red first: the workout generator's model select shows what generation runs and stores the `workout_generation` binding (unit + e2e 8.10).
- [x] 10. Red first: a key of four characters or fewer shows only the mask.
