# Proposal: Rewrite the WHOOP bridge to session piggyback (internal API)

## Why

The merged WHOOP integration (PR #842) is built on the wrong mechanism. Its
extension (`@kaiord/whoop-bridge`) runs an OAuth confidential-client flow
against WHOOP's **public developer API** (`api.prod.whoop.com/developer/v2/*`),
and `@kaiord/whoop` maps that API's shapes. That forces every user to register
their own app at developer.whoop.com and paste a client id/secret, and it can
only reach the throttled developer surface — never the data the WHOOP web app
itself shows.

The other two bridges (`garmin-bridge`, `train2go-bridge`) work the way users
expect: with the site open in a tab and the extension installed, they
piggyback the **already-authenticated session** and read the site's own
internal API — no credentials, no per-user app registration. This change makes
WHOOP work the same way.

A throwaway proof-of-concept (kept out of the repo) validated the mechanism and
the full data surface against a real account: a main-world `fetch`/`XHR`
interceptor captures the Cognito bearer WHOOP attaches to its internal API
calls, and a content-script fetch from the `app.whoop.com` tab origin reaches
the internal endpoints, each returning `HTTP 200` with
`access-control-allow-origin: https://app.whoop.com` (so the browser-origin
fetch the bridge relies on is CORS-permitted). Confirmed reachable and mapped:
`core-details-bff/v0/cycles/details` (recovery, sleep, strain, workouts),
`metrics-service` (heart-rate series), `advanced-labs-service` (blood
biomarkers), `health-service/v2/stress-bff` (stress), and the sport catalog.

This change **specifies and designs the entire WHOOP data program up front** —
every KRD schema and converter for all reachable data — and delivers it in
implementation **waves** so each PR stays reviewable and green. Nothing is left
undesigned; only the sequencing is staged.

## What Changes

- **`@kaiord/whoop-bridge` — rewrite from OAuth to session piggyback.** Remove
  the OAuth lifecycle (`whoop-oauth.js`), the BYOK credential popup, the
  `identity` permission, the developer-API base, and the refresh-token
  rotation. Add: a `world: "MAIN"` content script that captures the session
  bearer from WHOOP's own `api.prod.whoop.com` requests, relayed via
  `window.postMessage` to an isolated content script; a background worker that
  stores the token in `chrome.storage.session` (memory-only) and decodes the
  numeric user id from the JWT `custom:user_id` claim; a read-only path
  allowlist over the program's internal endpoints; a content-script proxy that
  fetches from the `app.whoop.com` tab origin with the captured bearer; the
  shared announce script; and the origin-pinned external message API. Adding a
  read endpoint in a later wave means only extending the allowlist. Permissions
  become `tabs`, `webRequest`, `scripting`, `storage`; host permissions cover
  `api.prod.whoop.com` and `app.whoop.com`.
- **KRD — three new read-only health sub-schemas.** WHOOP exposes derived
  metrics with no FIT counterpart, so `health-data` gains three source-agnostic,
  read-only sub-schemas (no bidirectional FIT adapter mandated):
  `extensions.health.strain` (cardiovascular load 0–21 + day HR + kilojoules),
  `extensions.health.vitals` (respiratory rate, SpO₂, skin temperature, resting
  HR), and `extensions.health.heartRateSeries` (uniform bpm samples). They join
  the health discriminated union and the `managedDataTypes` routing union
  (`strain`, `vitals`, `heart-rate-series`). Recovery HRV, sleep, and stress
  reuse the existing frozen `hrv`, `sleep`, and `stress` types; WHOOP workouts
  reuse the existing `activity` domain type; WHOOP blood biomarkers reuse the
  existing `lab` domain.
- **`@kaiord/whoop` — rewrite the adapter for the internal API, all converters.**
  Remove the developer-API v2 schemas/converters and the OAuth service. Add Zod
  schemas for the internal responses (`cycles/details`, `metrics`, sport
  catalog, biomarker tests) and pure converters to every target: recovery →
  `hrv` + `vitals`; sleeps → `sleep` (+ respiratory rate → `vitals`); cycle →
  `strain`; metrics → `heartRateSeries`; workouts → `activity` (sport resolved
  via the catalog, kJ → kcal); biomarker tests → `LabReport`/`LabValue`;
  stress-bff → `stress`. The package stays a PURE adapter with the read
  transport injected.
- **SPA — bridge-backed transport + sync of every type.** Add the WHOOP read
  transport (relaying `whoop-fetch` through the discovered bridge) and per-type
  sync use cases that pull, convert, and upsert with `sourceBridgeId:
"whoop-bridge"`, deduped by `(sourceBridgeId, externalId)`. The managed-store
  types (HRV, sleep, vitals, strain, heart-rate-series, activity, stress) are
  gated by the policy resolver like every other bridge; the Advanced-Labs import
  feeds the `lab` domain directly (labs is not a `ManagedDataType`), as the AI
  lab-extraction feature does. The bridge only announces capability tokens that
  already exist in the frozen `bridgeCapabilitySchema` enum (`read:body`,
  `read:sleep`, `read:activities`) — no new token. Discovery, heartbeat, rate
  limiting, and the operation queue reuse the generic bridge stack unchanged.
- **Athlete Connections — WHOOP connect/disconnect via the bridge.** WHOOP joins
  Garmin and Train2Go as a `bridge`-mechanism provider: connect opens an
  `app.whoop.com` tab; disconnect clears the local bridge linkage and disables
  WHOOP's flows. No credential is ever stored for WHOOP.

## Implementation waves (design is complete; sequencing is staged)

- **Wave 1 — bridge + recovery/sleep.** The piggyback extension rewrite, the
  adapter's cycles schema + `hrv`/`sleep` converters, the SPA transport + sync,
  and the connections UI. Uses only existing frozen KRD types; shippable alone.
- **Wave 2 — new KRD types: strain + vitals.** The `strain` and `vitals`
  sub-schemas (core), their converters (recovery/sleep/cycle), and their sync.
- **Wave 3 — heart-rate series + workouts→activity.** The `heartRateSeries`
  sub-schema + `metrics` converter, and the workout→`activity` converter + sync.
- **Wave 4 — stress + Advanced Labs.** The stress-bff → `stress` converter and
  the biomarker → `lab` ingestion (the biomarker-values endpoint path is the one
  open item — captured from the WHOOP web app before this wave).

## Capabilities

### New Capabilities

- `whoop-bridge`: the Chrome extension that piggybacks the `app.whoop.com`
  session — main-world bearer capture, isolated relay, read-only internal-API
  allowlist, tab dependency, runtime announcement, and the origin-pinned
  external message API. No OAuth, no stored credentials.
- `spa-whoop-extension`: SPA-side WHOOP integration — bridge discovery reuse, a
  bridge-backed read transport, the per-type sync use cases (HRV, sleep, vitals,
  strain, heart-rate series, activities, stress, labs), and the
  connect/disconnect UI.
- `whoop-health-adapter`: `@kaiord/whoop` as a pure internal-API adapter — the
  response schemas and every converter to the KRD health/activity/lab targets,
  with the transport injected.

### Modified Capabilities

- `health-data`: the capability scope grows from six to nine metric types,
  adding the read-only wearable-session sub-schemas `strain_summary`,
  `vitals_summary`, and `heart_rate_series` (no FIT bidirectional requirement),
  with their sub-schema definitions and conversion tolerances.
- `athlete-connections`: the provider catalog gains WHOOP as a `bridge`
  mechanism, so connect/disconnect follows the same bridge-linkage semantics as
  Garmin and Train2Go.

## Impact

- **Packages**: `@kaiord/core` (public — three new health sub-schemas + three
  `managedDataTypes` tokens + tolerances; additive minor), `@kaiord/whoop`
  (public — converters/schemas replaced; changeset major), `@kaiord/whoop-bridge`
  (private extension — full rewrite), `@kaiord/workout-spa-editor` (private —
  transport, sync use cases, connections UI, registry wiring).
- **Dependencies**: none added. The extension stays plain JavaScript (the
  documented bridge exception to strict-TS). `@kaiord/whoop` and `@kaiord/core`
  keep Zod only.
- **Persistence**: WHOOP records use the existing managed stores and
  `sourceBridgeId` provenance. New `managedDataTypes` (`strain`, `vitals`,
  `heart-rate-series`) and their Dexie stores/indexes land with the wave that
  first persists them; earlier waves reuse existing stores (HRV, sleep,
  activity, lab, stress). Any Dexie bump is isolated to the wave that needs it.
- **Hexagonal layers**: new health sub-schemas live in `@kaiord/core`
  `domain/schemas/health`; `@kaiord/whoop` stays a `core`-only adapter with the
  transport injected; SPA sync is `application/` use cases over the existing
  repositories plus the bridge read transport; UI stays in
  components/hooks/contexts.
- **Public API**: `@kaiord/whoop` root exports change shape (major);
  `@kaiord/core` gains additive health-schema exports (minor). `design.md`
  carries the `@kaiord/whoop` migration note.
- **Tests**: the extension's vitest suite is rewritten for the piggyback flow;
  `@kaiord/core` gains sub-schema unit tests (valid/rejection/refinement) for
  strain/vitals/heart-rate-series; `@kaiord/whoop` gains converter tests against
  internal-API fixtures with the documented conversion tolerances; the SPA gains
  transport, per-type sync, and connections-UI tests. Coverage thresholds
  unchanged (80/70).
- **Referenced specs**: `spa-bridge-protocol` and `bridge-runtime-discovery`
  (consumed unchanged), `garmin-bridge` / `spa-garmin-extension` (the pattern
  this change mirrors), `krd-format` (unmodified — the new sub-schemas are
  `extensions.health.*` payloads, not root-shape changes), `spa-lab-extraction`
  (the labs domain the biomarker converter feeds), and `adapter-contracts`
  (the read-only coverage declaration for the three new metrics).
