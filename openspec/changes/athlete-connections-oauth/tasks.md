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

- [ ] 4.1 Extend `connection-config.ts`: declare each provider's `mechanism` (Garmin/Train2Go `bridge`, intervals.icu `api-key`, Strava/Wahoo `not-supported`)
- [ ] 4.2 Add a `useConnectionStatus` live hook reading the `connections` store per profile
- [ ] 4.3 Refactor disconnect: compose `clear connection/credential` + existing `disableBridge` flow-disable into a single real `disconnect` (update `use-policy-toggle.ts` callers)
- [ ] 4.4 Render the api-key connect affordance (key entry + validation states) for intervals.icu
- [ ] 4.5 Render the honest `not-supported` state for Strava/Wahoo (no functional Connect action; clear "not supported yet" copy)
- [ ] 4.6 Show real `connected`/`disconnected` state per the connection record (not policy inference)

## 5. Verify + ship

- [ ] 5.1 Add tests covering every spec scenario (connection state, mechanism catalog, api-key connect valid/invalid, real disconnect for api-key + bridge, unsupported state, credential encryption, snapshot exclusion, profile-delete cascade)
- [ ] 5.2 `pnpm -r test && pnpm -r build && pnpm lint:fix` clean; zero warnings; coverage thresholds met
- [ ] 5.3 Run `pnpm test:scripts` (mechanical guards incl. PII) green
- [ ] 5.4 `npx openspec validate athlete-connections-oauth` passes
- [ ] 5.5 Add a changeset (`@kaiord/workout-spa-editor`); open the PR referencing #714
