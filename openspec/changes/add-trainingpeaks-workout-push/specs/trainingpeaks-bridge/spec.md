## ADDED Requirements

### Requirement: Structured-workout write action

The `trainingpeaks-bridge` extension SHALL expose a `push-workout` action that
relays a caller-built structured-workout payload to
`POST /fitness/v6/athletes/{athleteId}/workouts` on `tpapi.trainingpeaks.com`,
using the Bearer minted from the athlete's own session cookie by `tp-auth.js`.
The athlete id SHALL be taken from the message, else from the payload, else
resolved via `ensureAthleteId`. The bridge SHALL relay the payload verbatim and
SHALL NOT inspect, re-encode, or re-serialise it — in particular its
`structure` field arrives as a JSON string, which the API requires and an
object form of which the API rejects.

#### Scenario: Workout is relayed to the v6 endpoint

- **GIVEN** a live TrainingPeaks session and a payload whose `structure` is a JSON string
- **WHEN** the SPA sends `{ action: "push-workout", workout }`
- **THEN** the bridge SHALL POST that payload unchanged to `/fitness/v6/athletes/{athleteId}/workouts` with an `Authorization: Bearer` header and `credentials: "omit"`, and SHALL return the created workout

#### Scenario: Missing payload is refused before any network call

- **WHEN** a `push-workout` message arrives with no `workout`
- **THEN** the bridge SHALL throw `Missing workout payload` and SHALL NOT issue a request

### Requirement: Planning-horizon refusal is reported as a subscription limit

TrainingPeaks answers `402 Payment Required` with an empty body when
`workoutDay` falls beyond the account's forward-planning horizon — one day
ahead on a Basic account, evaluated in the athlete's account timezone rather
than the browser's. Because the same refusal applies to a workout carrying no
structure at all, it is a subscription limit and not a payload defect. The
bridge SHALL surface a 402 from the workout write with a distinct message
naming the account limit, rather than the generic push-failure message.

#### Scenario: A too-distant date is explained, not reported as a bad payload

- **GIVEN** a valid structured workout dated beyond the account's planning horizon
- **WHEN** the bridge receives the 402
- **THEN** it SHALL throw an error whose message attributes the refusal to the account tier, carrying the HTTP status

### Requirement: One created workout can be read back

The bridge SHALL expose a `read-workout` action that issues
`GET /fitness/v6/athletes/{athleteId}/workouts/{workoutId}` for a numeric
`workoutId`, so the SPA can read the live state of a workout it created
before deciding a re-send. Only the workout's `workoutId` and `workoutDay`
SHALL leave the service worker. A failure SHALL carry TrainingPeaks' HTTP
status. The allowlist SHALL admit that single-workout path only: no range
read, and no `DELETE`, `PUT` or `PATCH`. The read serves the workout write
and declares no new capability.

#### Scenario: The read returns only id and day

- **GIVEN** a live session and a workout TrainingPeaks holds
- **WHEN** the SPA sends `{ action: "read-workout", workoutId }`
- **THEN** the bridge SHALL GET that one workout with a Bearer and return only `{ workoutId, workoutDay }`

#### Scenario: A missing workout keeps its status

- **WHEN** TrainingPeaks answers the read with `404`
- **THEN** the bridge SHALL reject with an error carrying `status: 404` and no `needsReauth`

#### Scenario: A malformed id is refused before any request

- **WHEN** `read-workout` arrives without a numeric `workoutId`
- **THEN** the bridge SHALL throw `Missing workout id` and SHALL NOT issue a request

### Requirement: A failed token exchange keeps its cause

A token exchange SHALL set `needsReauth` only when the session-fetch master
reports a dead session (a redirect, `401` or `403`), or when a `200` carries
no token or no JSON. Any other failure, such as a `500`, SHALL keep its HTTP
status and SHALL NOT set `needsReauth`. When `checkSession` is not
authenticated it SHALL report `needsReauth` as that distinction.

#### Scenario: A server error is not a revoked sign-in

- **GIVEN** the token exchange answers `500`
- **WHEN** a workout write needs a token
- **THEN** the bridge SHALL reject with `status: 500` and without `needsReauth`

#### Scenario: A dead session still asks for a sign-in

- **GIVEN** the token exchange is redirected to the login page
- **WHEN** `checkSession` or a workout write runs
- **THEN** the answer SHALL carry `needsReauth: true`

### Requirement: Workout write is declared in every capability surface

The bridge SHALL advertise `write:workouts` in `BRIDGE_MANIFEST.capabilities`
in `background.js` AND in `KAIORD_BRIDGE_IDENTITY.capabilities` in
`bridge-identity.js`, which `scripts/check-bridge-core-parity.test.mjs` holds
in lockstep. The new tpapi route and the new external action SHALL appear in
the `scripts/fixtures/bridge-privacy-surface.json` golden, each allowlist entry
remaining on a single physical line so the guard's extractor reads it whole.

#### Scenario: Capability surfaces agree

- **WHEN** the parity guard compares `background.js` with `bridge-identity.js`
- **THEN** both SHALL list `write:workouts` and the guard SHALL pass

#### Scenario: Privacy surface records the new route

- **WHEN** `check-bridge-privacy-surface.mjs` extracts the bridge's surface
- **THEN** `allowed_paths` SHALL contain the `POST` entry for `/fitness/v6/athletes/{id}/workouts` and `external_actions` SHALL contain `push-workout`, matching the golden
