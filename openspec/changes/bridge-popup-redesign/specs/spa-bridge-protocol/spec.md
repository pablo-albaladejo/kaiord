## ADDED Requirements

### Requirement: Profile snapshot push action

The SPA↔Bridge protocol SHALL define a `profile-snapshot` action that the SPA uses to push the active athlete profile to a registered bridge for popup-side display. The bridge SHALL store the snapshot bytes in `chrome.storage.local` under the key `profileSnapshot` together with a `receivedAt` epoch-millisecond timestamp, and SHALL NOT interpret, transform, or forward the snapshot payload anywhere else.

The action message SHALL have the shape:

```
{ action: "profile-snapshot", snapshot: ProfileSnapshot }
```

where `ProfileSnapshot` is a typed DTO with `schemaVersion: 1` and the fields listed in the next requirement.

The bridge response envelope SHALL be `{ ok: true, protocolVersion: 1, data: { storedAt: <epoch ms> } }` on success and `{ ok: false, protocolVersion: 1, error: string, retryable: boolean }` on failure (e.g., schema validation, prototype-pollution rejection, storage write error, byte-budget rejection).

#### Scenario: SPA pushes a snapshot to a connected bridge

- **WHEN** the SPA sends `{ action: "profile-snapshot", snapshot: <valid v1 snapshot> }` to a registered bridge via `chrome.runtime.sendMessage`
- **THEN** the bridge SHALL persist `{ ...snapshot, receivedAt: <Date.now()> }` to `chrome.storage.local` under the key `profileSnapshot` and respond with `{ ok: true, protocolVersion: 1, data: { storedAt: <Date.now()> } }`

#### Scenario: Bridge rejects an unsupported schema version

- **WHEN** the SPA sends `{ action: "profile-snapshot", snapshot: { schemaVersion: 99, ... } }`
- **THEN** the bridge SHALL NOT write to `chrome.storage.local` and SHALL respond with `{ ok: false, protocolVersion: 1, error: "Unsupported snapshot schema version", retryable: false }`

#### Scenario: Bridge rejects a malformed snapshot

- **WHEN** the SPA sends `{ action: "profile-snapshot", snapshot: { schemaVersion: 1, profile: { name: "" }, ... } }` and the snapshot fails the bridge's structural validator (empty `name`, negative numeric, or unknown `activeSport` enum)
- **THEN** the bridge SHALL NOT write to `chrome.storage.local` and SHALL respond with `{ ok: false, protocolVersion: 1, error: "Invalid snapshot payload", retryable: false }`

#### Scenario: Bridge rejects a prototype-pollution payload

- **WHEN** the SPA sends `{ action: "profile-snapshot", snapshot: { __proto__: { isAdmin: true }, schemaVersion: 1, profile: { name: "Pablo" }, generatedAt: "2026-05-01T00:00:00Z" } }` (or any payload whose own keys include `__proto__`, `constructor`, or `prototype`)
- **THEN** the bridge SHALL reject with `{ ok: false, protocolVersion: 1, error: "Invalid snapshot payload", retryable: false }`, SHALL NOT write to `chrome.storage.local`, and the global `Object.prototype` SHALL NOT be mutated by the validator

#### Scenario: Bridge rejects an oversized snapshot

- **WHEN** the SPA sends a snapshot whose JSON serialization exceeds 8 KiB
- **THEN** the bridge SHALL respond with `{ ok: false, protocolVersion: 1, error: "Snapshot too large", retryable: false }` and SHALL NOT write to `chrome.storage.local`

#### Scenario: Concurrent snapshot pushes are last-write-wins

- **WHEN** two SPA tabs simultaneously push valid snapshots derived from the same active profile state (post-persistence-commit, identical fingerprint) to the same bridge
- **THEN** both pushes SHALL ack `ok: true` and the value persisted in `chrome.storage.local` SHALL be whichever push the bridge processed second; no scenario SHALL leave the cache key partially written or in an inconsistent state. Note that the SPA's de-duplication is per-tab; cross-tab duplicates cannot be eliminated without a shared coordinator and are accepted as harmless

#### Scenario: Bridge reports a storage-write failure

- **WHEN** the bridge's `chrome.storage.local.set` call rejects (e.g., quota exhaustion or runtime error not caused by an oversized payload)
- **THEN** the bridge SHALL respond with `{ ok: false, protocolVersion: 1, error: <runtime message>, retryable: false }`, and the SPA's push adapter SHALL log the failure at debug level, SHALL NOT surface a user-visible toast (the failure is not user-actionable), and SHALL NOT mark the push as the most-recent-successful for de-duplication purposes

#### Scenario: Bridge service-worker restart during snapshot write

- **WHEN** the SPA pushes a snapshot, the bridge service worker is terminated between `chrome.storage.local.set` resolving and `sendResponse` firing, and the SPA's transport timeout elapses with no response
- **THEN** the SPA's push adapter SHALL treat the absent response as transient (no exception thrown to the caller), SHALL NOT mark the push as the most-recent-successful, and the next mutation- or VERIFIED-trigger SHALL push again. The protocol provides at-least-once delivery; bridges MUST tolerate replay since the cache write is idempotent. Each successful write SHALL overwrite `receivedAt` with the new `Date.now()` value, so the popup's staleness check uses the most-recent write timestamp and replay is correctness-preserving.

#### Scenario: SPA→bridge transport reuses the existing port

- **WHEN** the SPA constructs a `profile-snapshot` (or `profile-snapshot-clear`) action
- **THEN** the message SHALL be sent through the existing `sendBridgeMessage(extensionId, message)` transport defined in `packages/workout-spa-editor/src/adapters/bridge/bridge-transport.ts` without requiring a new port method or a typed-envelope wrapper that did not exist before this change

#### Scenario: Pre-redesign bridge ignores the action

- **WHEN** the SPA sends `{ action: "profile-snapshot", snapshot: <valid v1 snapshot> }` to a bridge built before this change
- **THEN** the bridge SHALL respond with an `ok: false` envelope (e.g., `Unknown action: profile-snapshot`), the SPA SHALL log the failure at debug level, SHALL continue without surfacing a user-visible error, AND SHALL NOT mark the push as the most-recent-successful for de-duplication purposes (so the next mutation will retry)

### Requirement: Profile snapshot clear action

The protocol SHALL define a `profile-snapshot-clear` action that the SPA uses to purge a bridge's cached snapshot when the active profile is deleted in the SPA (right-to-be-forgotten path).

The action message SHALL be `{ action: "profile-snapshot-clear" }` (no payload). The bridge SHALL remove the `profileSnapshot` key (and any cached `lastWeeklyRollup`) from `chrome.storage.local` and respond with `{ ok: true, protocolVersion: 1, data: null }`.

#### Scenario: SPA clears the snapshot

- **WHEN** the SPA sends `{ action: "profile-snapshot-clear" }` to a registered bridge
- **THEN** the bridge SHALL delete the `profileSnapshot` key from `chrome.storage.local` and respond with `{ ok: true, protocolVersion: 1, data: null }`

#### Scenario: Clear is idempotent

- **WHEN** the SPA sends `{ action: "profile-snapshot-clear" }` to a bridge whose `profileSnapshot` key is already absent
- **THEN** the bridge SHALL respond with `{ ok: true, protocolVersion: 1, data: null }` without raising an error

### Requirement: Profile snapshot DTO

The `ProfileSnapshot` DTO SHALL be defined in `@kaiord/core` (`packages/core/src/types/profile-snapshot.ts`), Zod-validated on the SPA side before it is sent, and structurally re-validated on the bridge side before it is stored. The DTO SHALL contain only fields needed to render the popup athlete card; per-zone tables and full profile metadata SHALL NOT be included.

The DTO fields SHALL be:

- `schemaVersion`: literal `1`
- `profile`: `{ name: string (1..100), bodyWeight?: positive number }`
- `activeSport`: optional, one of `"cycling" | "running" | "swimming"`
- `thresholds`: object with optional `cycling.ftp` (positive int), optional `running.thresholdPaceSecPerKm` (positive int), optional `running.lthr` (positive int), optional `swimming.cssPaceSecPer100m` (positive int)
- `heartRate`: object with optional `max` (positive int), optional `lthr` (positive int)
- `generatedAt`: ISO 8601 datetime string

The serialized JSON SHALL NOT exceed 8192 UTF-16 code units; longer payloads SHALL be rejected by both validators with a non-retryable `Snapshot too large` error. "Serialized length" means `JSON.stringify(snapshot).length` with no replacer or spacer (UTF-16 code-unit count, NOT a byte count — non-ASCII names cost the same as ASCII at this metric, which is why 8192 is generous given the schema's 100-char `name` cap). The SPA's mapper SHALL build the snapshot in the field order documented in this requirement so the serialized length is deterministic for a given input.

Both validators (SPA Zod schema and bridge structural validator) SHALL be covered by parity tests that share a common fixture set exported from `@kaiord/core/test-utils` so SPA-accepted payloads are bridge-acceptable and vice versa. The fixture set SHALL include a positive baseline, partial-zone variants per sport, a v99 schema-version negative, an oversized-payload negative, and a prototype-pollution negative (`{ __proto__: { ... }, ... }`).

The plain-JS bridge validator SHALL construct outputs via `Object.create(null)`, SHALL inspect own keys via `Object.getOwnPropertyNames`, and SHALL reject any input whose own keys include `__proto__`, `constructor`, or `prototype`. The validator SHALL NOT mutate `Object.prototype`.

#### Scenario: Validators accept a valid payload

- **WHEN** a valid `ProfileSnapshot` matching the DTO is provided to either validator
- **THEN** both validators SHALL accept it and return the parsed value with the same field set

#### Scenario: Validators reject a payload missing required fields

- **WHEN** a payload missing `schemaVersion`, `profile.name`, or `generatedAt` is provided to either validator
- **THEN** both validators SHALL reject it with a non-empty error message

#### Scenario: Validators reject a payload that would pollute Object.prototype

- **WHEN** a payload containing an own key `__proto__`, `constructor`, or `prototype` is provided to either validator
- **THEN** both validators SHALL reject it without writing to storage and without mutating `Object.prototype`

#### Scenario: Validators reject nested prototype-pollution

- **WHEN** a payload whose top-level keys are clean but a nested object (e.g., `profile`, `thresholds`, `thresholds.cycling`, `heartRate`) carries an own key `__proto__`, `constructor`, or `prototype` is provided to either validator
- **THEN** both validators SHALL recursively reject it without writing to storage and without mutating `Object.prototype`

#### Scenario: Validators accept partial-zone payloads

- **WHEN** a valid payload is provided where the `thresholds` object includes only some sport sub-fields (e.g., `running.lthr` set, `running.thresholdPaceSecPerKm` absent) and `heartRate` includes only `max` (no `lthr`)
- **THEN** both validators SHALL accept the payload and the parsed value SHALL preserve the absent fields as undefined (not coerced to zero or null)

### Requirement: Snapshot push triggers

The SPA SHALL push a fresh `ProfileSnapshot` to every registered bridge whose status is VERIFIED:

- after any mutation to the active profile in the SPA's persistence layer (this includes: active profile id transition `null → newId`, active profile id changed `oldId → newId`, sport zones edited, body weight changed, or active sport changed), and
- after a bridge transitions to VERIFIED following registration or recovery from UNAVAILABLE.

The push SHALL be non-blocking — UI flows MUST NOT wait for the bridge response before completing the user-visible action that triggered the snapshot push.

The push SHALL count toward the bridge's hourly rate limit; if the limit would be exceeded, the push SHALL be skipped silently (no user-visible toast) since the bridge will receive the next snapshot on the next mutation or heartbeat-recovery event.

The SPA SHALL de-duplicate consecutive pushes by content fingerprint. The protocol SHALL define a pure function `fingerprintSnapshot(snapshot)` (exported from `@kaiord/core`) that returns a stable hash of `(profile.id, snapshot fields excluding generatedAt)`. Stability is guaranteed by `@kaiord/core`'s implementation; consumers SHALL NOT re-implement the hash. The function is private to the SPA's de-dup adapter — bridges SHALL NOT compute or compare fingerprints. If the next snapshot for a given bridge has a fingerprint equal to the most recent successful push to that bridge, the push SHALL be skipped without charging the rate limiter.

A push SHALL NOT be marked as the most-recent-successful in any of the following cases: transport timeout (no response, e.g., due to bridge SW restart); bridge response with `ok: false` for any reason (validation failure, storage failure, unknown action on a pre-redesign bridge). Only an `ok: true` ack from the bridge updates the de-duplication state.

The SPA SHALL push a `profile-snapshot-clear` action (instead of a fresh `profile-snapshot`) when the active profile is deleted, to every registered bridge whose status is VERIFIED. If a registered bridge is currently UNAVAILABLE when the deletion occurs, the SPA SHALL persist a `pendingClear` flag for that bridge in its sync state and SHALL emit the clear when the bridge next transitions to VERIFIED, before sending any new snapshot.

#### Scenario: Active profile mutation triggers push

- **WHEN** the user edits the active profile (e.g., changes FTP) and the change is committed to the SPA's persistence layer
- **THEN** the SPA SHALL build a fresh `ProfileSnapshot` from the new profile state and send a `profile-snapshot` action to every VERIFIED bridge

#### Scenario: First profile creation triggers push

- **WHEN** the SPA's persistence layer transitions from no-active-profile (`activeProfileId === null`) to a newly-created profile being selected
- **THEN** the SPA SHALL build a `ProfileSnapshot` from the newly-active profile and send a `profile-snapshot` action to every VERIFIED bridge

#### Scenario: Bridge becomes VERIFIED triggers push

- **WHEN** a registered bridge transitions from UNAVAILABLE (or fresh registration) to VERIFIED
- **THEN** the SPA SHALL send a `profile-snapshot` action to that bridge with the current active profile's snapshot

#### Scenario: UNAVAILABLE bridge does NOT receive a push

- **WHEN** the active profile is mutated and a registered bridge's current status is UNAVAILABLE
- **THEN** the SPA SHALL NOT send a `profile-snapshot` action to that bridge for this mutation; the bridge will receive the latest snapshot when it next transitions to VERIFIED

#### Scenario: Push is non-blocking

- **WHEN** a user-visible profile-mutation flow (e.g., "Save profile") completes
- **THEN** the UI SHALL NOT wait for the snapshot push response before showing the success state to the user

#### Scenario: Rate-limited push is skipped silently

- **WHEN** the snapshot push would exceed the hourly rate limit defined in this protocol
- **THEN** the SPA SHALL skip the push without surfacing a toast and SHALL NOT retry until the next trigger event

#### Scenario: Duplicate push is skipped without charging the rate limiter

- **WHEN** the SPA would push a snapshot whose `fingerprintSnapshot(snapshot)` equals the fingerprint of the most recent successful push to that bridge
- **THEN** the SPA SHALL skip the push, SHALL NOT call `chrome.runtime.sendMessage`, and SHALL NOT charge the per-bridge rate limiter

#### Scenario: Duplicate content with different `generatedAt` is still de-duplicated

- **WHEN** the SPA would push two snapshots derived from the same active profile state where the only field difference is `generatedAt` (e.g., the second was constructed 5 seconds later)
- **THEN** the second push SHALL be skipped because `fingerprintSnapshot` excludes `generatedAt` from the hash; only one transport call SHALL be observed

#### Scenario: Active profile deletion triggers a clear

- **WHEN** the user deletes the active profile in the SPA
- **THEN** the SPA SHALL send `{ action: "profile-snapshot-clear" }` to every VERIFIED bridge instead of a fresh snapshot

#### Scenario: Profile deleted while a bridge is UNAVAILABLE

- **WHEN** the user deletes the active profile and a registered bridge is currently UNAVAILABLE
- **THEN** the SPA SHALL set a per-bridge `pendingClear` flag in its sync state, SHALL NOT attempt the clear immediately, AND SHALL emit `{ action: "profile-snapshot-clear" }` when that bridge next transitions to VERIFIED — before sending any new `profile-snapshot` to it
