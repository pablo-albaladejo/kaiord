## 1. Session probes

- [x] 1.1 Add `checkTanitaSession` to `adapters/tanita/tanita-transport.ts` (`checkSession`, 5s timeout, non-strict zod on the manifest-noise envelope) + transport tests, with a header warning that it costs a full export download and MUST NOT be polled.
- [x] 1.2 Create `adapters/bridge/bridge-session-probe-types.ts` (`SessionProbeResult`, `SessionProber`, `active`/`inactive` constructors).
- [x] 1.3 Create `adapters/bridge/bridge-ping-session-probes.ts` (garmin `gcApi.ok`, train2go `sessionActive`; protocol-version check replicated, not imported from `store/` or `hooks/`) + tests.
- [x] 1.4 Create `adapters/bridge/bridge-session-probes.ts` wiring the four cheaply-probeable bridges into `SESSION_PROBES` + tests, including one pinning tanita-bridge's deliberate absence.

## 2. Connection store

- [x] 2.1 Create `adapters/bridge/bridge-connection-types.ts` (`BridgeConnectionRuntime`, `BridgeConnectionState`, store contract, factory options).
- [x] 2.2 Create `adapters/bridge/bridge-connection-entries.ts` (default rows, change detection, signature-cached snapshot reader).
- [x] 2.3 Create `adapters/bridge/bridge-connection-refresh.ts`: positive-only 30s cache, re-entrancy guard, non-throwing probe wrapper, discovered-but-unprobed rows, stale-write guard on the in-flight extensionId, `Promise.allSettled`.
- [x] 2.4 Create `adapters/bridge/bridge-connection-store.ts` (singleton parked on `globalThis`, discovery subscription, 5-minute interval, visibility refresh with a 60s floor, probes outside `BRIDGE_QUEUE`).
- [x] 2.5 Tests: undiscovered bridges not probed, discovered-without-prober is never messaged, discovery-driven appearance, positive-cache hit/miss/expiry, `force` bypass, re-entrancy guard, stale-write race (vanished AND swapped), error folding, interval, `start()` idempotence, visibility floor skip/run, stop cleanup, HMR identity.

## 3. Read model

- [x] 3.1 Create `hooks/use-bridge-connections-bootstrap.ts` + test; leave it UNMOUNTED and document that the first consuming wave mounts it.
- [x] 3.2 Create `hooks/use-bridge-connections.ts` (`useSyncExternalStore` + ONE `useLiveQuery`) + tests.

## 4. Sync sources and freshness

- [x] 4.1 Create `integrations/bridge-sync-sources.ts` (`BRIDGE_SYNC_SOURCES`, `syncSourceFor`, train2go exception documented) + tests.
- [x] 4.2 Create `application/data-hub/read-bridge-sync-states.ts` as the one reader, with `byIntegrationId` / `byBridgeId` indexers.
- [x] 4.3 Replace the hardcoded train2go/garmin ternary in `use-data-hub-matrix.ts` via `hooks/data-hub/use-bridge-sync-states.ts`; drop the now-unused `use-source-sync-state.ts`.
- [x] 4.4 Migrate `hooks/chat/build-data-route-signals.ts` off its train2go-only lookup onto the shared reader + test that tanita/TrainingPeaks freshness surfaces.
- [x] 4.5 Point `adapters/train2go/use-train2go-data.ts` at `syncSourceFor` so the historical key has one home.
- [x] 4.6 Write `coachingSyncState` after a successful `syncTanitaImport` / `syncTrainingPeaksWeight` through a REQUIRED dep, wired from both hooks + tests for the write and the no-write paths.

## 5. Guards and specs

- [x] 5.1 Extend `BRIDGE_RUNTIME_STORES` in `bridge-store-persistence-boundary.test.ts` to cover the new `adapters/bridge/` modules (paths relative to `src/`), and assert every guarded path exists on disk.
- [x] 5.2 Add the `spa-bridge-connection-model` capability delta and rewrite the `spa-bridge-protocol` lifecycle requirement.
- [x] 5.3 Full SPA suite green; typecheck clean; eslint `--max-warnings=0`; prettier clean; `openspec validate` passes.
