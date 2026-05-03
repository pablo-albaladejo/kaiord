## Context

Train2Go is the source of truth for athlete training thresholds: the user's coach configures FTP, LTHR, threshold paces, max HR and body composition in the platform's "Physiological data" / "Training and competition paces" sections. The Kaiord SPA already integrates with Train2Go via the `@kaiord/train2go-bridge` Chrome extension for **calendar** data, but threshold values are still entered manually in `Profile Manager → Training Zones`. The bridge already has a verified upstream session and a content-script-based fetch transport (validated against an explicit ALLOWED-list); extending that to a single new endpoint is a small surface change.

Two existing flows constrain the design:

1. **`attempt-link.ts`** documents an invariant: heartbeat / detection pings MUST NOT mutate `linkedAccounts` because a heartbeat after disconnect would silently re-link. The same invariant applies here — heartbeats MUST NOT silently mutate profile thresholds. Zone propagation is gated behind explicit user-triggered events only.

2. **The bridge spec** (`packages/train2go-bridge/spec.md`) mandates an allowlist for `train2goFetch` paths. Any new endpoint widens the privacy surface and must update the privacy-surface golden (`scripts/fixtures/bridge-privacy-surface.json`) plus the Web Store listing copy.

## Goals / Non-Goals

**Goals:**

- Eliminate the manual duplication of threshold values from Train2Go to Kaiord for the common path: user has just linked their account.
- Preserve user agency: never overwrite a manually-entered Kaiord value without an explicit per-field confirmation.
- Reuse the existing bridge transport — no new permissions strings, no new tab-management complexity.
- Keep the change opt-in so users who prefer Kaiord-as-system-of-record see no behavioral drift on upgrade.

**Non-Goals:**

- Full Z1-Z5 zone tables. They are deterministically derived from threshold + zone-method (Coggan-7, % LTHR, etc.) which Kaiord already implements. Importing them would create two competing zone-derivation paths.
- Recurring background sync. Out of scope; the user clicks "Sync" or re-links if zones change.
- Bidirectional sync (writing Kaiord values back to Train2Go). Train2Go is read-only as far as this change is concerned.
- Garmin equivalent. The proposal scopes this to Train2Go; Garmin's data model and bridge surface are different. The transport port stays optional (`readZones?:` returns `null` for Garmin).

## Decisions

### D1: Conflict policy is "ask per field" for non-empty Kaiord values

When the SPA fetches Train2Go zones, it builds a per-field diff against the persisted profile. Three buckets:

```text
  Kaiord field state               Action
  ───────────────────              ─────────────────────
  empty                            silent fill from Train2Go
  same value as Train2Go           no-op
  different value (manual entry)   include in dialog; user picks per row
```

A single dialog opens at the end of the sync run with all conflicting fields listed. The user accepts/rejects per row. Cancelling the dialog cancels only the conflicting writes — silent fills already committed remain.

**Why this over "T2G always wins":** users who have done their own ramp test or imposed a manual cap (e.g., "I'm using FTP=200 because I'm coming back from injury and don't want full effort") would silently lose that value. The friction of one extra confirmation is preferable to the data-loss footgun.

**Why this over "Kaiord always wins / fill empty only":** users who linked Train2Go _because_ their coach updated zones and they want the new values would never see them propagate after the first sync. Per-field accept gives them the control they want without making it the default.

### D2: Sync trigger is the existing `connect` callback + the existing calendar `sync` callback, gated by a per-link flag

The new toggle persists alongside the linked account record (`profile.linkedAccounts[i].syncZones: boolean`, default `false`). Two trigger points:

1. **`useConnectCallback` (`adapters/train2go/use-train2go-actions.ts`)**: after `attemptLink` resolves `ok`, if `syncZones === true` for the source, call `syncZones(profileId, transport)`. The link succeeds even if the zones sync fails (logged, not thrown).

2. **`useSyncCallback` (same file)**: after the weekly read completes, if `syncZones === true`, run `syncZones(profileId, transport)` with the same per-field reconciliation.

**Why not on `useTrain2GoDetection` (heartbeat):** explicit `attempt-link.ts` invariant — detection pings must not mutate profile data. Mirroring that.

**Why two trigger points rather than one:** initial link should auto-fetch (otherwise the toggle would have no immediate effect, surprising the user who just enabled it). Subsequent syncs should re-fetch so coach-side updates flow without a re-link dance.

### D3: Architecture — hexagonal port extension on `CoachingTransport`

Application layer adds a use case `syncZones(profileId, transport, repo)` in `application/coaching/sync-zones.ts`. The transport port `CoachingTransport` (in `application/coaching/coaching-transport-port.ts`) gains:

```ts
readZones?: (externalUserId: string, signal?: AbortSignal) => Promise<ZonesPayload | null>;
```

Optional because Garmin doesn't implement it. The use case checks `if (!transport.readZones) return { ok: false, reason: "unsupported" }`.

`ZonesPayload` is the bridge's raw-shape output (snake-cased DOM `name=` attributes mapped to camelCased payload keys; see D6's naming-convention note). The SPA-side `syncZones` use case maps `payload.*` → Kaiord-domain `incoming.*` (per-sport thresholds), reconciles against the persisted profile, and writes silent fills eagerly. This keeps T2G-shape coupling at the bridge boundary, NOT in the application layer.

#### Three name layers

1. **`payload.*`** — raw bridge output (e.g., `payload.paces.cycling.z4Upper`, `payload.hrZones.cycling.z4Upper`, `payload.physiological.weight`). Camelcase, 1-indexed zone names. The `ZonesPayload` type's literal field paths.
2. **`incoming.*`** — Kaiord-shaped, post-mapper, pre-reconciliation (e.g., `incoming.cycling.thresholds.ftp`, `incoming.running.thresholds.lthr`). The intermediate object the use case diffs against the persisted profile.
3. **Persisted profile** — IDB rows under `profiles[id]` with the full Kaiord schema (e.g., `cycling.thresholds.ftp`, `bodyWeight`).

Spec scenarios reference layers explicitly: `payload.*` for bridge contracts, `incoming.*` for mapper assertions, plain `<sport>.thresholds.<field>` for persisted-state assertions.

#### Type shapes (canonical)

```ts
// in packages/workout-spa-editor/src/types/coaching-zones.ts
export type FieldKey =
  | "cycling.thresholds.ftp"
  | "cycling.thresholds.lthr"
  | "running.thresholds.lthr"
  | "running.thresholds.thresholdPaceSecPerKm"
  | "swimming.thresholds.cssPaceSecPer100m"
  | "heartRate.max"
  | "bodyWeight";

export type WrittenField = {
  field: FieldKey;
  value: number; // already-applied silent fill
};

export type ConflictItem = {
  field: FieldKey;
  current: number; // pre-sync value in the persisted profile
  incoming: number; // value the T2G payload would write
};

export type SyncZonesResult =
  | { ok: true; applied: WrittenField[]; conflicts: ConflictItem[] }
  | {
      ok: false;
      reason:
        | "unsupported"
        | "transport-error"
        | "shape-mismatch"
        | "profile-deleted";
      error?: string;
    };

export type ConflictDecision = "accept" | "reject";
```

`commitConflictResolution(profileId, decisions: Record<FieldKey, ConflictDecision>, repo, transportPayload): Promise<void>` — the second-phase function the UI invokes after the user's per-row choices.

```text
  Layer                  Owner
  ─────                  ─────
  types/coaching-zones.ts FieldKey, WrittenField, ConflictItem, SyncZonesResult, ConflictDecision (NEW; sibling of types/coaching-account.ts)
  application            syncZones use case, commitConflictResolution
  ports                  CoachingTransport.readZones (NEW, optional)
  adapters/train2go      train2go-coaching-transport.readZones (NEW)
  adapters/train2go      train2go-extension-transport.readZones (NEW wire fetch)
  packages/train2go-bridge content.js + background.js: read-details action (NEW)
```

### D4: Bridge endpoint discovery — RESOLVED (server-rendered HTML)

**Spike result (2026-05-03)**: `/user/details` is **server-rendered HTML** (Laravel + Blade). All zones data is inline in the response — there is NO separate JSON endpoint for reads. The page contains five logical sections, each identified by stable DOM IDs:

| DOM container       | Source data                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#physio-{userId}`  | `weight`, `height`, `bpm_max`, `bpm_rest`, `fat`, `gender`, `birthday`, `imc`, `smoker` (all as `<input value="...">`)                                 |
| `#hrzones-{userId}` | Generic + per-sport HR zones; `Z1..Z5` lower/upper as `<input name="zN_lower" value="...">`                                                            |
| `#paces-{userId}`   | Training paces per sport (`sport_id=1` running, `2` swimming, `3` cycling). Times split as `[min, sec]` for run/swim; single integer for cycling watts |
| `#records-{userId}` | Records including explicit FTP test (`<div>FTP</div>` + `<label>263</label> <small>Watt</small>`)                                                      |
| `#tests-{userId}`   | Test results including explicit FTP, VAM, etc.                                                                                                         |

The PUT/DELETE endpoints (`/api/v2/hrzones/{id}`, `/api/v2/paces/{id}`, `/api/v2/details/physio/{userId}`) exist for write operations but are not relevant for our read-only sync.

**Implication for the bridge**: rather than a dedicated JSON-zones action, the bridge implements `read-details` that fetches `/user/details` and parses the HTML inline. This matches the existing pattern of `parseWeeklyHtml` / `parseDailyHtml` for calendar data — same package boundary, same testing style.

**ALLOWED list addition**: a single GET pattern: `^/user/details$`. No query params.

### D5: FTP source resolution — paces section wins

The HTML exposes FTP through **two** independent sources that may disagree:

1. **`#paces-{userId}` cycling Z4 upper / Z5 lower** (the "Training and competition paces" section).
2. **`#tests-{userId}` explicit `Functional Threshold Power (FTP)` test row**.

**Decision**: prefer the **paces section**. Reason: in T2G's coaching workflow, the paces table is what the coach actively maintains and updates as the athlete progresses (post-test, post-block); the Tests section is a historical log of one-off measurement events. Pulling from Tests would surface stale data after the coach has already adjusted the zones for the current training block.

In the spike sample, the explicit FTP test was 263W (dated 2025-07-23), while the cycling Z4 upper was 268W (paces dated 2026-04-06) — 5W gap, **paces are the newer and authoritative number**. This single data point validates the heuristic.

**Mapping (deterministic precedence)**: `incoming.cycling.thresholds.ftp` ← `payload.paces.cycling.z4Upper`. Fallback to `payload.paces.cycling.z5Lower` ONLY if `z4Upper` is absent or 0. The mapper SHALL emit a warning in the parser logs when `z4Upper` and `z5Lower` disagree by more than 1 watt (informational, not failing). The parser MUST NOT expose the explicit FTP test value (`#tests-{userId}` or `#records-{userId}` rows) — those are stripped by the field allowlist (see "parseDetailsHtml emits an explicit field allowlist" requirement).

### D6: Threshold pace and CSS derivation

For running and swimming, T2G's Z4 represents 80–89% VAM (Velocidad Aeróbica Máxima / Maximum Aerobic Speed). The binding threshold value Kaiord cares about is **z4Upper** for both running and swimming CSS. Kaiord's `running.thresholds.thresholdPaceSecPerKm` represents the **lactate threshold 2 (LT2 / threshold pace / lap pace)** — the upper boundary of Z4 in T2G's 5-zone model. NOT LT1 (aerobic threshold). Swimming `cssPaceSecPer100m` uses the same z4Upper as the threshold proxy; note that CSS (Critical Swim Speed) is conceptually a maximal-aerobic-speed approximation, not a strict LT2 measurement — we are using z4Upper as a coaching-shortcut proxy, not asserting CSS≡LT2 physiologically.

- `running.thresholds.thresholdPaceSecPerKm` ← `payload.paces.running.z4Upper` converted from `min:sec/km` to `int seconds/km`.
- `swimming.thresholds.cssPaceSecPer100m` ← `payload.paces.swimming.z4Upper` converted from `min:sec/100m` to `int seconds/100m`.

Round to nearest second. v1 exposes z4Upper only. The mapper output SHALL NOT include z4Lower. If the convention turns out wrong, a follow-up change introduces it; we don't speculate.

#### Naming-convention note

DOM `name=` attributes in the upstream HTML use **snake_case** with **0-indexed** visual zones (e.g., `z3_upper` is the upper bound of visual Z4). Parsed `ZonesPayload` keys use **camelCase** with **1-indexed** zones (e.g., `z4Upper`). This mapping is the parser's contract; tests assert it explicitly (see "T2G's 0-indexed DOM names map to 1-indexed payload keys" scenario in `train2go-bridge/spec.md`).

#### HR threshold per sport

Mirroring the per-sport pace logic above, HR thresholds map 1:1 from the per-sport HR zone block in the HTML:

- `cycling.thresholds.lthr` ← cycling HR Z4 upper (`#hrzones-{userId}` cycling block, `z3_upper` in T2G's 0-indexed naming convention).
- `running.thresholds.lthr` ← running HR Z4 upper (same block, running variant).
- Swimming LTHR is NOT mapped (Kaiord has no consumer for it today).

The mapper keys off DOM IDs and stable `name=` attributes, never visible labels, so a triathlete profile with separate cycling and running HR zone blocks emits independent LTHR values.

### D7: Bridge protocol version stays at 1

Adding `read-details` and the `read:training-zones` capability is a backwards-compatible bridge protocol extension; `BRIDGE_MANIFEST.protocolVersion` stays at `1`. SPAs gate the toggle on the new capability string `read:training-zones`, NOT on a version bump. Older bridges that don't advertise the capability are detected client-side and the toggle is hidden — no protocol-incompatibility surface to manage.

### D8: Privacy surface widening is documented

`packages/train2go-bridge/store-listing.md` adds a paragraph: "After enabling 'Sync zones' in Kaiord's Linked Account settings, the extension reads from your Train2Go user-details page: training thresholds (FTP, LTHR, threshold pace, CSS), heart-rate maximum, and body weight. Other fields on that page (birthday, gender, body-fat percentage, body-mass index, smoker status, resting heart rate) are read by the page itself but are NOT extracted, transmitted, or persisted by Kaiord. Off by default."

The privacy-surface golden (`scripts/fixtures/bridge-privacy-surface.json`) is updated as part of the apply phase, in the same commit that adds the ALLOWED entries.

## Risks / Trade-offs

| Risk                                                                       | Mitigation                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The conflict dialog is annoying when many fields differ                    | The first-time link path is silent (Kaiord empty → fill all). The dialog only appears when the user has manually entered values; in that case they want the choice. Single dialog with multi-row select keeps it compact.                                                                  |
| Train2Go changes its API shape without notice                              | Same risk profile as the existing weekly endpoint. The mapper validates the payload (fail-soft: if expected fields are missing, return `{ ok: false, reason: "shape-mismatch" }` and skip the sync; existing values stay untouched).                                                       |
| Web Store review flags the broadened read access                           | The host_permission for `app.train2go.com/*` is already granted; we are reading additional paths within the same host. Listing copy update is preemptive.                                                                                                                                  |
| User toggles "Sync zones" off — should we revert previously synced values? | No. Toggle controls future syncs only; profile data committed during a previous sync stays as user-owned data. Documenting in the toggle's helper text.                                                                                                                                    |
| heartRate.max from `/profile/ping` and from `/user/details` could disagree | Decision: zones-sync uses ONLY `/user/details` `physiological.bpmMax` and ignores the ping payload. The ping `data.user.bpm_max` remains an independent source consumed by the heartbeat / Profile Manager status display, never by zones-sync. No reconciliation between the two sources. |

## Migration Plan

No public API breakage. Apply phases:

1. **Spike**: discover endpoint(s), capture sample response shape in `test-fixtures/`.
2. **Bridge layer**: add ALLOWED entry, `read-details` action, parser. Update privacy-surface golden.
3. **SPA transport + use case**: implement `readZones` on the Train2Go transport, write `syncZones` use case with reconciliation logic.
4. **SPA UI**: add the toggle to LinkedAccountRow, wire conflict-resolution dialog, fan out from connect/sync callbacks.
5. **Tests**: bridge action tests, transport mapper unit tests, use case tests covering empty / same / conflict branches, UI tests for the dialog.
6. **Listing + changeset**: update Web Store copy, add changeset (minor on `@kaiord/train2go-bridge`, minor on `@kaiord/workout-spa-editor`).

Rollback: revert the PR. Toggle defaults off, so even if the merge ships and we revert, no user state is corrupted.

## Open Questions

1. ~~Endpoint shape~~ — **RESOLVED**. Server-rendered HTML on `/user/details`; bridge parses inline data.
2. ~~Pace units~~ — **RESOLVED**. Mapper converts `min:sec/km` → integer `secPerKm` and `min:sec/100m` → integer `secPer100m`. Sample fixture confirms two-input split (`measurement[zN_lower][0]` for minutes, `measurement[zN_lower][1]` for seconds).
3. ~~Multi-sport profiles~~ — **RESOLVED**. Inline HTML uses `sport_id=1` (running), `2` (swimming), `3` (cycling) attributes; mapper keys per-sport accordingly.
4. **LTHR exposure**: T2G's HR zones do not surface an explicit "LTHR" field. The Z4 upper bound (`z3_upper` in the form, despite being the 5th visual zone — T2G uses 0-indexed names internally) is the conventional LTHR proxy. v1 maps it as `running.thresholds.lthr` and `cycling.thresholds.lthr`. Open: should `swimming.thresholds.lthr` mirror or stay empty? **Decision deferred to apply** (no swimming LTHR field is currently used by Kaiord's UI; mapping it costs nothing if empty-on-T2G yields empty-in-Kaiord).
5. **HR zones overlap heuristic**: when a profile has BOTH a "Generic" HR zone block and per-sport HR zones, we currently parse the per-sport one. Confirm during apply that the per-sport block is always present when generic is — otherwise we may need to fall back.
6. **Localization**: T2G UI is bilingual (the spike sample shows English headers because of accept-language ordering). The PARSER SHOULD key off DOM IDs and `name` attributes (which are stable identifiers like `bpm_max`, `weight`, `z0_lower`), not on visible labels — this is already the design.
