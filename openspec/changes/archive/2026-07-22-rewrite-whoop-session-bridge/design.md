# Design: WHOOP session-piggyback bridge (full data program)

## Context

The merged WHOOP integration chose the developer OAuth API; this change
replaces it with the session-piggyback model the other two bridges use, and
designs the full internal-API data surface up front. The mechanism and every
endpoint below were validated end to end against a live account with a throwaway
extension (results summarized in the proposal's Why); the raw payload shapes
quoted in the decisions are from that validation.

Exploration of the current tree established:

- `packages/whoop-bridge` is MV3 plain JS with `permissions: ["storage",
"identity"]`, `whoop-oauth.js` (auth-code + refresh rotation), a BYOK popup,
  and a `/v2/*` developer-API allowlist. `packages/whoop` maps the developer API.
- The SPA already treats WHOOP as a `bridge` (`bridgeId: "whoop-bridge"`),
  renders a WHOOP source badge, and `pick-effective-health-record` recognizes
  `whoop-bridge`. Missing: transport, sync, connect wiring.
- Garmin is the reference: `webRequest` CSRF capture, `content.js` same-origin
  fetch with `credentials: "include"`, `garmin-activities-transport.ts`.
- `@kaiord/core` health payloads are a discriminated union of six
  (`sleep/weight/hrv/daily/bodyComposition/stress`), each carrying optional
  `kaiordRecordId`/`sourceBridgeId`/`externalId`; `healthVersionSchema` is
  `/^2\.\d+$/`. `managedDataTypes` are `workout, planned-session, activity,
training-zones, weight, sleep, hrv, daily-wellness, body-composition, stress`.
  `activitySchema` = `{ kind:"activity", summary: {...}, krd? }`; the `lab`
  domain is `LabReport` + `LabValue`.
- The internal WHOOP API is bearer-authenticated (Cognito JWT), NOT
  cookie-authenticated; its host (`api.prod.whoop.com`) differs from the page
  origin (`app.whoop.com`) but CORS permits the `app.whoop.com` origin.

## Goals / Non-Goals

**Goals**

1. WHOOP works like Garmin/Train2Go: session open + extension installed → reads
   flow, no credentials, no per-user app registration.
2. Design every KRD schema and converter for all reachable WHOOP data now.
3. Delete the OAuth path (extension + adapter) rather than leave it dormant.
4. Reuse the generic bridge stack unchanged; ship in reviewable waves.

**Non-Goals**

- Strength-Trainer exercise-level data (`weightlifting-service`): a separate
  domain (sets/reps/loads) with no current KRD home; its own future change.
- Writing WHOOP data back to any provider (the bridge is read-only).
- Chrome Web Store publishing (kept load-unpacked like the current bridges; a
  `manifest.prod.json` ships for parity).

## Decisions

### D1 — Capture the bearer in the main world, relay through the isolated world

The internal API authenticates with a Cognito bearer, not cookies, so the
bridge must obtain the token. `webRequest.onBeforeSendHeaders` alone proved
unreliable in MV3 for waking the service worker in time. A `world: "MAIN"`
content script at `document_start` wraps `window.fetch` and
`XMLHttpRequest.prototype.setRequestHeader`, reads the `Authorization: bearer`
WHOOP attaches to its own API calls, and `postMessage`s it (MAIN world has no
`chrome.*`). An isolated script forwards it to the background, which stores it
in `chrome.storage.session` (memory-only, survives SW restart, never logged)
and decodes `custom:user_id`. `webRequest` capture is retained as a secondary
path. The MAIN→isolated handoff is origin-pinned both ways: the MAIN script
`postMessage`s to `https://app.whoop.com` (never `"*"`), and the isolated
listener accepts only `event.source === window` with `event.origin ===
"https://app.whoop.com"`, so another script on the page cannot sniff or spoof
the token. The bridge never runs OAuth and never refreshes — it rides the web
app's own token and refresh.

### D2 — Read fetch runs in the tab origin, not the background

The proxy fetch runs in the isolated content script on the `app.whoop.com` tab,
calling `https://api.prod.whoop.com${path}` with the captured bearer,
`credentials: "include"`, and a 30s `AbortController`. Running in the tab origin
carries `Origin: https://app.whoop.com`; the validation showed the API returns
`access-control-allow-origin: https://app.whoop.com`, so the browser permits it.

### D3 — Read-only allowlist grows by wave, never a write path

The content script fetches only GET paths under a fixed allowlist:
`/core-details-bff/v0/cycles/details`, `/metrics-service/v1/metrics/user/`,
`/activities-service/v1/sports/history`,
`/advanced-labs-service/v1/biomarker-tests`, `/health-service/v2/stress-bff`.
Anything else is rejected without a network call. Adding a wave's endpoint is an
allowlist edit and nothing else. `bootstrap` is not on the allowlist — the
numeric user id comes from the JWT `custom:user_id` claim (D1), not a profile
read. `sleep-service/v1/sleep-events` is likewise omitted: sleep stages are
built from the cycle's aggregate stage durations (D8), not a separate timeline
endpoint, matching the existing `sleep-stages.builder.ts`.

### D3b — Capability tokens reuse the frozen enum; no new token is invented

The SPA's `bridgeCapabilitySchema` is a closed enum and `verifyAnnouncement`
`safeParse`s the manifest, so a single out-of-enum capability token rejects the
whole bridge. WHOOP therefore announces ONLY existing tokens, matching how the
registry already gates the managed types: `read:body` (recovery/HRV, vitals,
strain, stress), `read:sleep` (sleep), `read:activities` (workouts→activity).
No `read:recovery`/`read:strain`/`read:vitals`/`read:heart-rate`/`read:labs`
token is introduced — those were an error; the already-merged whoop-bridge
correctly announced `["read:body", "read:sleep"]`. The new `managedDataTypes`
(`strain`, `vitals`, `heart-rate-series`) get `MANAGED_DATA_REGISTRY` entries
whose `import` token is `read:body`, so the enum is untouched. Labs are not a
managed type and carry no capability token (D6).

### D4 — Three new read-only KRD health sub-schemas; the rest reuse frozen types

The frozen six health types have no home for WHOOP's derived cardiovascular
metrics (`daily_wellness` is Garmin steps/calories-shaped). Rather than distort
them, `health-data` gains three **read-only, source-agnostic** sub-schemas —
explicitly NOT mandated to round-trip through FIT, unlike the six:

- `extensions.health.strain`: `{ date, strainScore (0–21), dayAverageHeartRate?,
dayMaxHeartRate?, energyKilojoules? }`. WHOOP `scaled_strain` is the 0–21
  scale; `day_avg/max_heart_rate` and `day_kilojoules` ride along. Refinement:
  `dayMax >= dayAvg`.
- `extensions.health.vitals`: `{ measuredAt, respiratoryRate?, spo2Percent?,
skinTempCelsius?, restingHeartRate? }`, refine ≥1 present. A neutral home for
  the daily vitals WHOOP scatters across `recovery` (spo2, skin temp, resting
  HR) and `sleeps` (respiratory rate). Chosen over extending `hrv` because these
  are not HRV and because a single type serves any wearable's vitals. The
  converter produces exactly ONE vitals payload per cycle, folding both sources
  — two payloads sharing a cycle identity would otherwise overwrite each other.
- `extensions.health.heartRateSeries`: `{ startTime, intervalSeconds,
samples: (int|null)[] }` — compact uniform-interval series; `null` = gap.
  KRD had no per-sample HR type; this is the minimal shape for a daily HR trace
  that is not tied to a recorded activity.

All three carry the standard `sourceBridgeId`/`externalId` provenance and the
`/^2\.\d+$/` version. They join the discriminated union and `managedDataTypes`
(`strain`, `vitals`, `heart-rate-series`). Recovery HRV → `hrv`, sleep →
`sleep`, stress → `stress` reuse frozen types unchanged.

### D5 — WHOOP workouts are `activity` records, not a new type

WHOOP's embedded per-workout data (`sport_id`, `during`, `average_heart_rate`,
`kilojoules`) maps to the existing `activity` domain `summary`: `sport` resolved
from `sport_id` via the `sports/history` catalog (fetched once, cached),
`total_calories` from `kilojoules` (kJ → kcal), `source: "whoop"`, `source_id`
from the workout `activity_id`. This reuses the Data Hub's `activity` import
path; no new domain type. An unknown `sport_id` degrades to a generic label
rather than failing the whole cycle sync.

### D6 — Advanced-Labs biomarkers feed the existing `lab` domain

WHOOP blood biomarkers are lab data, not `extensions.health.*`. A WHOOP
biomarker test → a `LabReport` (dated from `test_date`, `labName` from the
upload source) plus one `LabValue` per biomarker, mapped to the labs catalog by
exact/alias match and otherwise `custom:<slug>` (the existing labs rule shared
with the AI lab-extraction feature). Because `lab` is NOT a `ManagedDataType`
and has no `IntegrationPolicy` representation, the WHOOP labs import is NOT gated
by the policy resolver: it is a user-initiated import into the `lab` domain
(exactly like the AI lab-extraction feature) that only requires the bridge to be
VERIFIED. **Open item:** the endpoint returning the raw per-biomarker values was
not captured in validation (the landing endpoint is UI-shaped;
`biomarker-tests/{id}` returns metadata only). Wave 4 begins by capturing that
path from the WHOOP web app's test-results screen; the converter contract (test
→ report + values) is fixed here regardless of the path.

### D7 — Stress maps to `stress_episode`, acknowledged as the fragile source

`health-service/v2/stress-bff` is a large BFF (~1.5 MB, UI-shaped). WHOOP models
stress as a continuous daily metric, so the converter derives one or more
`stress_episode` payloads (`startTime`/`endTime`/`averageLevel`/`peakLevel`)
from the day's stress series. **Two shapes must be confirmed against a captured
fixture before this wave** (like the labs values endpoint): the stress-bff field
layout, and WHOOP's stress scale. `stress_episode` requires integers 0–100; if
WHOOP reports a different scale (e.g. 0–3), the converter SHALL apply an explicit
linear transform to 0–100, defined once the fixture is captured. This is the
most fragile mapping (BFF extraction, no clean domain endpoint); it lands last
(Wave 4) and its converter is isolated so a WHOOP UI change breaks only stress.

### D8 — `@kaiord/whoop` rewritten for internal shapes; transport injected

The developer-API schemas/converters are deleted and replaced with internal-API
schemas and the D4–D7 converters. The target KRD contracts are unchanged for
the reused types (`hrv`/`sleep`/`stress`/`activity`/`lab`); the new types are
added in `@kaiord/core`. The package stays pure: it performs no I/O; the SPA
injects the bridge read transport (as today's `WhoopHttpClient` was injected).

### D9 — SPA sync mirrors the Garmin activities pull, per type, policy-gated

Each data type gets a sync use case that pulls its endpoint for a bounded window
(the BFF caps windows near 200 days; use cases chunk), converts via
`@kaiord/whoop`, and upserts by `(sourceBridgeId, externalId)` through the
existing repository. Import is gated by `resolveImportPolicies(profileId,
dataType)` exactly like Garmin; the per-bridge queue, 60/hour limit, and
throttle come from `spa-bridge-protocol` unchanged.

### D10 — Delete, don't dormant-flag, the OAuth path

The OAuth extension files (`whoop-oauth.js`, credential popup, `identity`
permission) and the developer-API converters/schemas are removed, not flagged.
They encode a different, incompatible auth model; keeping them invites drift.
The feature never shipped to users (no store listing, no stable production id),
so there is no migration burden.

### D11 — Wave sequencing and Dexie isolation

Waves are ordered so the shippable core (recovery + sleep, existing KRD types,
no Dexie bump) lands first, then each subsequent wave adds one or two new types
with its own isolated Dexie migration only when it first persists a new store:

1. Bridge rewrite + `hrv`/`sleep` (no new store; existing health records).
2. `strain` + `vitals` (new `managedDataTypes` + stores; one Dexie bump).
3. `heartRateSeries` + workouts→`activity` (heart-rate-series store; activities
   reuse the existing `activity` store).
4. `stress` (reuses `stress` store) + Advanced Labs → `lab` (reuses lab store).

## Risks & Mitigations

- **WHOOP changes its internal API shape** → each endpoint is isolated behind a
  Zod schema that fails loudly; converters are the only coupling; a kill-switch
  (`chrome.storage.local` flag, as Garmin's pull has) disables a pull without
  breaking the SPA.
- **BFF-shaped endpoints (stress, labs landing) drift** → their converters are
  isolated and land last; the clean domain endpoints (cycles, metrics) are the
  backbone and are not BFF.
- **New KRD types over-fit WHOOP** → `strain`/`vitals`/`heartRateSeries` are
  named and shaped source-agnostically so Oura/Apple Health can target them
  later; they are read-only, so no FIT writer is forced.
- **Token leakage** → token lives only in `chrome.storage.session`, never
  logged, never reaches the page or SPA; only relayed read results cross.
- **Advanced-Labs values endpoint unknown** → Wave 4 captures it first; the
  converter contract is fixed independently of the path.

## Migration (breaking `@kaiord/whoop` public API)

`@kaiord/whoop` removes the developer-API exports; the converter names may be
reused but their input types change, and the schemas are replaced. The only
consumer is the SPA in this repo, migrated across the waves. A major changeset
documents the break; no external consumers are known. `@kaiord/core` changes are
additive (new health sub-schemas + tokens), a minor.

## Rollback

Each wave is an independent PR. Reverting Wave 1 restores the OAuth extension and
developer-API adapter as merged. Later waves are additive (new types + syncs);
reverting one removes its affordance and, if it introduced a Dexie store, the
migration is a no-op on absent data. No published package is yanked beyond the
`@kaiord/whoop` major already implied by Wave 1.
