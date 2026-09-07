## Why

Kaiord can already read a coaching plan from Train2Go and turn it into a
structured KRD workout with AI, but the only destination it can write a workout
to is Garmin Connect. TrainingPeaks — the platform the athlete's coach actually
uses — is wired for body metrics only: `trainingpeaks-bridge` handles
`ping`/`checkSession`/`read-metrics`/`push-weight`/`open-trainingpeaks`, its
tpapi allowlist holds three metric-and-token routes, and the SPA pins
`SUPPORTED_EXPORT_TYPES["trainingpeaks-bridge"] = []`. That leaves the
end-to-end story — read from Train2Go, structure with AI, push to
TrainingPeaks — one leg short.

The expensive half of that leg already exists. `tp-auth.js` performs a
cookie→Bearer exchange, caches and refreshes the token, and resolves the
athlete id, and the bridge already issues a POST for weight.
`executeWorkoutPush` is destination-agnostic: it takes a `destinationBridgeId`
and a `pushFn`, enforces the export policy inside the action, and records the
push idempotently. What is missing is only the TrainingPeaks-specific tail.

The request shape was unknown and is now measured. On 2026-09-07 a live capture
plus follow-up probes against the athlete's own account established the
contract, and two facts that no public source states: `structure` travels as a
JSON-encoded **string** (the API returns it as an object but rejects one), and
a block's `length.value` is its **repeat count**, not a duration.

## What Changes

- Add a **KRD → TrainingPeaks structured-workout converter** to
  `@kaiord/trainingpeaks` (today a metrics-only adapter), with a Zod schema
  derived from the capture, a reverse-engineered `polyline` builder pinned
  against real API output, and `Lossy conversion:` warnings for every zone
  collapsed to a midpoint and every absolute target dropped for want of an
  athlete threshold.
- Add a **`push-workout` action** to `trainingpeaks-bridge`, one allowlist
  entry for `POST /fitness/v6/athletes/{id}/workouts`, and `write:workouts` in
  both `BRIDGE_MANIFEST` and `bridge-identity.js`. Refresh the privacy-surface
  golden.
- **Cable the SPA**: a workout-write transport, a `pushFn` adapter, a threshold
  mapper that converts the profile's pace units into the speed KRD uses, a push
  hook mirroring `useGarminPush`, and `SUPPORTED_EXPORT_TYPES` narrowed from
  `[]` to `["workout"]`.
- Add the two capability specs whose absence is the cleanest evidence the
  feature was never built: `trainingpeaks-bridge` and
  `spa-trainingpeaks-extension`.

## Impact

- **Affected packages**: `@kaiord/trainingpeaks`, `@kaiord/trainingpeaks-bridge`,
  `@kaiord/workout-spa-editor`, plus the `scripts/fixtures` privacy golden.
- **Guards touched**: `check-bridge-privacy-surface.mjs` (new allowed path and
  external action) and `check-bridge-core-parity.test.mjs` (capabilities must
  match between `background.js` and `bridge-identity.js` — a second guard that
  is easy to miss).
- **Account-tier limit, not a defect**: TrainingPeaks answers `402 Payment
Required` for any `workoutDay` beyond the account's planning horizon — one day
  ahead on a Basic account, evaluated in the **athlete's** timezone, not the
  browser's. The gate is the date, not the structure: an unstructured workout at
  +2 days is refused identically. The bridge surfaces this with its own message
  so it is never mistaken for a malformed payload.
- **Not in scope**: reading workouts back from TrainingPeaks, the exercise
  library (which has no date gate and is a candidate follow-up), the official
  partner API, and any Chrome Web Store release.
