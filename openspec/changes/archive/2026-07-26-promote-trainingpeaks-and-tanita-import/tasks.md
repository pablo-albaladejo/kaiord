## 1. Registry promotion

- [x] 1.1 `integration-registry-entries.ts`: trainingpeaks → `mechanism: "bridge"`, `bridgeId: "trainingpeaks-bridge"`.
- [x] 1.2 Update `connection-config.test.ts` (drop the not-supported pin; assert bridge + bridgeId).
- [x] 1.3 Update `integration-registry.test.ts` (KNOWN_BRIDGE_IDS length 5, TP caps fixture, weight-import eligibility case).
- [x] 1.4 Extend `integration-registry-capability-parity.test.ts` to read the real trainingpeaks-bridge and tanita-bridge manifests.

## 2. TrainingPeaks transport + weight import

- [x] 2.1 Add `@kaiord/trainingpeaks` as a SPA workspace dependency.
- [x] 2.2 Create `adapters/trainingpeaks/trainingpeaks-transport.ts` (`checkSession`, `read-metrics`; zod-validated; typed error with `needsReauth`).
- [x] 2.3 Create `application/trainingpeaks/sync-trainingpeaks-weight.use-case.ts` (policy-gated fail-closed; injected `readMetrics` + `parse`; canonicalHash external ids; shared upsert).
- [x] 2.4 Create `hooks/use-trainingpeaks-sync.ts` (discovery + authenticated-session gate, lazy converter import, single-shot per profile) and mount it in `use-calendar-executed.ts`.
- [x] 2.5 Unit tests: no-policy (no fetch), import, dedup, transport-error.

## 3. Tanita import

- [x] 3.1 Create `application/tanita/sync-tanita-import.use-case.ts` (per-extension extraction of weight AND body-composition; per-type policy flags; canonicalHash external ids).
- [x] 3.2 Create `hooks/use-tanita-import.ts` (discovery gate, `readTanitaExportCsv`, lazy `tanitaCsvToKrd`) and mount it in `use-calendar-executed.ts`.
- [x] 3.3 Unit tests: no-policy, both-extensions row → 2 records, weight-only flag → 1 record, transport-error.

## 4. Supported-route filter

- [x] 4.1 Create `integrations/bridge-supported-routes.ts` (tanita: weight+body-composition import; trainingpeaks: weight import, no export) + tests.
- [x] 4.2 Filter `eligibleBridgeIds` through `bridgeSupportsRoute`.
- [x] 4.3 Add REQUIRED `supportsRoute` signal to `data-hub-cell-state.ts` (checked before `isBridgeOnline`) and provide it from every construction site: `use-data-hub-matrix.ts` and `hooks/chat/build-data-route-signals.ts`.

## 5. Snapshot push gating

- [x] 5.1 Create `lib/profile-snapshot/snapshot-capable-bridges.ts` and filter both push and clear loops in `use-profile-snapshot-push.ts`.
- [x] 5.2 Parity test against `scripts/sync-bridge-core.mjs` `SNAPSHOT_BRIDGES`.

## 6. Badges and verification

- [x] 6.1 Add `tanita-bridge` / `trainingpeaks-bridge` to `health-source-badge.ts`.
- [x] 6.2 Full SPA suite green; typecheck clean; eslint --max-warnings=0; prettier clean.
