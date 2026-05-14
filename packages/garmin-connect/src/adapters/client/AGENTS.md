<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/client

Client factory and high-level workout service: wires auth, HTTP client, token manager; provides push/pull/list/remove with KRD serialization.

**Files:**

- `garmin-connect-client.ts` — Client factory; composes auth + service + init function
- `garmin-connect-client.types.ts` — GarminConnectClient, GarminConnectClientOptions, InitResult types
- `garmin-workout-service.ts` — WorkoutService implementation: push, pull, list, remove with error handling
- `build-refresh-fn.ts` — OAuth2 refresh function (calls Garmin token endpoint via raw fetch)
- `pull-workout.ts` — Pull single workout by ID, deserialize GCN → KRD
- `remove-workout.ts` — Delete workout from Garmin Connect

**Key flow:**

1. `createGarminConnectClient(options)` → sets up logger, fetch, retry, token manager
2. Token manager initialized with refresh function (OAuth2 exchange)
3. Auth provider created with token manager
4. HTTP client wraps token manager + retry + fetch
5. Workout service uses HTTP client + readers/writers for KRD ↔ GCN

**Patterns:**

- All public methods return Promises; async/await style
- Errors wrapped in ServiceApiError or ServiceAuthError from `@kaiord/core`
- KRD serialization via `toText(krd, garminWriter)` and readers
- Logger injected; defaults to console logger

<!-- MANUAL: -->
