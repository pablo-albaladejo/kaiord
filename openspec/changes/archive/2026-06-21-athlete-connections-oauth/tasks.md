## 1. Spike — intervals.icu API access (de-risk)

- [x] 1.1 Verify from a browser at the deployed origin that the intervals.icu API (`GET /api/v1/athlete/{id}` with an API key) is reachable cross-origin; record the request shape + auth header in the change folder
- [x] 1.2 Lock in the connect-time validation request and invalid-key error handling from 1.1 (intervals.icu is in scope — this informs the adapter, it is not a go/no-go gate)

## 2. Connection model + persistence

- [x] 2.1 Add `ConnectionRecord` + `ConnectionStatus` + `ConnectionMechanism` types (`profileId`, `providerId`, `status`, `mechanism`, `credentialRef?`, `updatedAt`) with a Zod schema
- [x] 2.2 Add Dexie v24 `connections` store (`[profileId+providerId]`, `profileId` index); register in `register-kaiord-versions*`; add v24 schema-declaration tests
- [x] 2.3 Add a `ConnectionRecordRepository` Dexie adapter (get/put/delete/getByProfile + deleteByProfile) with contract tests
- [x] 2.4 Wire the `connections` store into the profile-delete cascade (auto-discovered by `isPerProfileTable`); cascade integration test covers it
- [x] 2.5 Exclude the `connections` store from the cloud sync snapshot; added a test asserting it is absent from an exported snapshot

## 3. ConnectionProvider port + mechanism adapters

- [x] 3.1 Define the `ConnectionProvider` port: `connect(input)`, `disconnect(profileId)`, `status(profileId)` (port specified before adapters, per hexagonal rules)
- [x] 3.2 Implement the `bridge` adapter (Garmin, Train2Go): tracks local linkage; `disconnect` clears the connection record to `disconnected`
- [x] 3.3 Implement the `not-supported` sentinel adapter (Strava, Wahoo): `status` always `not-supported`, `connect` throws
- [x] 3.4 Implement the `api-key` adapter (intervals.icu): `connect` validates via injected request and stores encrypted; `disconnect` deletes the credential + record; `intervals-icu-validate.ts` does the live Basic-auth check
- [x] 3.5 Reuse `lib/crypto.ts` (AES-GCM) for credential encrypt/decrypt via `connection-credentials.ts`; unit-tested ciphertext-at-rest + round-trip

## 4. Catalog + UI wiring

- [x] 4.1 Extend `connection-config.ts`: declare each provider's `mechanism` (Garmin `bridge`, intervals.icu `api-key`, Strava/Wahoo `not-supported`)
- [x] 4.2 Add a `useConnectionStatus` live hook reading the `connections` store per profile
- [x] 4.3 Refactor disconnect: `useConnectionActions` composes `provider.disconnect` (clear record/credential) + `disableBridge` flow-disable into a single real disconnect (ConnectedRow + ApiKeyRow use it)
- [x] 4.4 Render the api-key connect affordance (`ApiKeyConnectForm` key entry + validation/error states) for intervals.icu via `ApiKeyRow`
- [x] 4.5 Render the honest `not-supported` state for Strava/Wahoo (`NotSupportedRow`, no functional Connect action)
- [x] 4.6 Show real `connected`/`disconnected` state per the connection record (api-key) / bridge discovery (bridge), not policy inference

## 5. Verify + ship

- [x] 5.1 Tests cover the spec scenarios: connection state + cascade (repo/cascade), mechanism catalog (connection-config test), api-key connect valid/invalid (adapter), disconnect for api-key + bridge (adapters), unsupported state (NotSupportedRow), credential encryption (credentials), snapshot exclusion (snapshot), profile-delete cascade (integration)
- [x] 5.2 Package test + build + lint clean; zero warnings
- [x] 5.3 `pnpm test:scripts` (mechanical guards incl. PII) green (pre-commit)
- [x] 5.4 `npx openspec validate athlete-connections-oauth` passes
- [x] 5.5 Add a changeset (`@kaiord/workout-spa-editor`); open the PR referencing #714
