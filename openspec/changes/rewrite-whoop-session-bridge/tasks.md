# Tasks: rewrite-whoop-session-bridge

The full program is designed here; implementation lands in four waves, each a
reviewable PR that leaves `pnpm -r test && pnpm -r build && pnpm lint` green.
Tests are written red before their implementation (xp-tdd-practices); every new
sub-schema and converter ships with valid/rejection/refinement unit tests (AAA,
`should …`).

## Wave 1 — Session-piggyback bridge + recovery/sleep

### 1.1 `@kaiord/whoop` — cycles schema + hrv/sleep converters

- [ ] 1.1.1 Add scrubbed `cycles/details` fixtures (bare-array + records-wrapped + missing-field); write schema tests (red); implement
      `adapters/schemas/whoop-cycles.schema.ts`.
- [ ] 1.1.2 Recovery → `hrv` converter (rMSSD = `hrv_rmssd * 1000` ±1 ms,
      `measurementWindow: "overnight"`, `score`, `sourceBridgeId`); tests red first.
- [ ] 1.1.3 Sleeps → `sleep` converter (stages from durations, total ms→s,
      score, stage-sum within ±60 s); tests red first.
- [ ] 1.1.4 Delete the developer-API surface (`whoop-recovery/sleep/paginated`
      schemas, `recovery-to-krd`/`sleep-to-krd`, OAuth service, `/v2` URLs);
      rewrite `index.ts`; add the `@kaiord/whoop` **major** changeset.

### 1.2 `@kaiord/whoop-bridge` — rewrite to piggyback

- [ ] 1.2.1 Rewrite `manifest.json`/`manifest.prod.json` (permissions `tabs`,
      `webRequest`, `scripting`, `storage`; hosts `api.prod.whoop.com` +
      `app.whoop.com`; MAIN + isolated content scripts; drop `identity`).
- [ ] 1.2.2 `inject-main.js` (MAIN): wrap `fetch`/`XHR`, extract + dedupe the
      bearer, `postMessage`; unit-test extraction/dedupe.
- [ ] 1.2.3 `content.js` (isolated): relay tokens; `localStorage` Cognito
      secondary capture; `whoop-fetch` tab-origin fetch with allowlist +
      30s abort; unit-test allowlist (cycles GET allowed, path/method blocked)
      and result shape.
- [ ] 1.2.4 `background.js`: `setToken` → `chrome.storage.session` + decode
      `custom:user_id`; `webRequest` secondary capture; `findWhoopTab`; relay;
      origin-pinned `onMessageExternal` (`ping`/`status`/`whoop-fetch`);
      re-inject on `onInstalled`; unit tests.
- [ ] 1.2.5 Delete `whoop-oauth.js` + credential popup; rewrite `popup.html/js`
      to status + "Open WHOOP"; `kaiord-announce.js` capabilities
      `["read:body", "read:sleep"]` (enum-valid tokens only; `read:body` gates
      recovery/HRV, `read:sleep` gates sleep — matches the merged bridge and the
      registry); en/es `_locales`; bump version; vitest green.

### 1.3 SPA — transport, recovery/sleep sync, connections

- [ ] 1.3.1 `adapters/bridge/whoop-transport.ts` fulfilling `@kaiord/whoop`'s
      read port via the discovered bridge; tests red first.
- [ ] 1.3.2 `application/whoop/sync-whoop-cycles.use-case.ts` (Wave-1 subset:
      hrv + sleep): policy-gated, chunked pull → convert → upsert by
      `(sourceBridgeId, externalId)`; tests red first.
- [ ] 1.3.3 Athlete Connections WHOOP row: Connect opens `app.whoop.com`;
      Disconnect clears linkage + disables flows; not-installed hint; component
      tests. en/es i18n for all new copy (static toast/console first-args).

## Wave 2 — New KRD types: strain + vitals

- [ ] 2.1 `@kaiord/core`: add `extensions.health.strain` and
      `extensions.health.vitals` sub-schemas + `strain`/`vitals`
      `managedDataTypes` + conversion tolerance constants; extend the health
      discriminated union; sub-schema unit tests (valid/rejection/refinement).
- [ ] 2.2 `@kaiord/whoop`: cycle → ONE `vitals` payload folding recovery
      (spo2/skin-temp/resting-hr) + sleep respiratory rate; cycle → `strain`;
      each stamped a stable `externalId` (`cycle:{id}:{kind}`); converter tests
      against fixtures with the tolerance constants.
- [ ] 2.3 SPA: extend the cycles sync to persist vitals + strain; add their
      Dexie stores/indexes in a single isolated migration; `MANAGED_DATA_REGISTRY`
      entries for `strain`/`vitals` with `import: "read:body"` (NO new
      `bridgeCapabilitySchema` token — reuse the existing enum); sync + registry
      tests.

## Wave 3 — Heart-rate series + workouts→activity

- [ ] 3.1 `@kaiord/core`: add `extensions.health.heartRateSeries` sub-schema +
      `heart-rate-series` `managedDataType` (registry `import: "read:body"`) +
      tolerance; union + unit tests.
- [ ] 3.2 `@kaiord/whoop`: `metrics-service` schema + → `heartRateSeries`
      converter (`stepSeconds` as an explicit arg; `null` for gap slots);
      `sports/history` catalog schema + `sport_id` resolver; workouts →
      `activity` converter (kJ→kcal, catalog sport, unknown-id fallback,
      `source_id` from workout `activity_id`); converter tests.
- [ ] 3.3 SPA: heart-rate-series sync (+ its Dexie store); workouts→activity
      sync into the existing `activity` store; extend the allowlist and add
      `read:activities` to the announce capabilities (heart-rate series reuses
      the already-announced `read:body`); tests.

## Wave 4 — Stress + Advanced Labs

- [ ] 4.1 Capture two payloads from the WHOOP web app and add scrubbed
      fixtures: the Advanced-Labs biomarker-VALUES endpoint (path unknown), and
      a `stress-bff` response to confirm its field layout AND stress scale
      (define the → 0–100 linear transform if WHOOP's scale differs).
- [ ] 4.2 `@kaiord/whoop`: biomarker test → `LabReport`/`LabValue` converter
      (catalog/alias match, `custom:<slug>` for unmatched, no value dropped);
      `stress-bff` → `stress_episode` converter (isolated, BFF-tolerant, applies
      the confirmed scale transform); converter tests.
- [ ] 4.3 SPA: Advanced-Labs user-initiated import into the `lab` domain (WHOOP
      provenance; NOT policy-resolver gated — labs is not a `ManagedDataType`,
      no capability token); stress sync into the `stress` store (gated on the
      already-announced `read:body`); extend the allowlist; tests.

## Cross-wave quality gates (each wave)

- [ ] Q.1 `pnpm -r test && pnpm -r build && pnpm lint` green; file/function caps
      respected; coverage thresholds met (80% core / 70% frontend); no
      `@kaiord/whoop` reference to `/developer/v2` remains.
- [ ] Q.2 `pnpm lint:specs` green for this change's delta specs.
- [ ] Q.2b With the wave that first modifies `health-data` (Wave 2), update the
      graduated `openspec/specs/health-data/spec.md` **Purpose** prose (via
      `/opsx:sync` at archive) so it reads "nine" health types, not "six" — the
      MODIFIED requirements already do, but the Purpose header must not
      contradict the body.
- [ ] Q.3 End-to-end verification against a live account (manual): load the
      extension unpacked, open `app.whoop.com`, run the wave's WHOOP sync from
      the SPA, and confirm the wave's records land with `sourceBridgeId:
    "whoop-bridge"`; attach evidence to the PR.
