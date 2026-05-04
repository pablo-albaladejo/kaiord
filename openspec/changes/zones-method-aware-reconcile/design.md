## Context

The shipped `train2go-zones-sync-full-bands` change populates the persisted profile's Z1-Z5 zone tables from T2G's pre-computed bands. After running it once against Pablo's real account, the conflict dialog produced 30+ pseudo-conflict rows on a freshly-created profile with no user-customized data:

```
   Cycling HR Z3 min  0 bpm → 148 bpm   ● Keep current  ○ Accept Train2Go
   Cycling HR Z3 max  0 bpm → 160 bpm   ● Keep current  ○ Accept Train2Go
   ...30 more rows...
```

Two failure modes coincide:

1. **Reconcile semantics gap.** The shipped `reconcile` checks `zones.length === 0` to detect "empty"; if the array exists with default seed values (`{minBpm: 0, maxBpm: 0}` × 5 for HR, `calculatePowerZones("coggan-7")` × 7 for power), the per-band path runs and produces a conflict for every band where `current === 0` and `incoming > 0`. The profile factory (`packages/workout-spa-editor/src/application/profile/helpers/profile-factory.ts:30`) seeds every new profile with these template defaults, so the "empty" branch never fires for the load-bearing first-sync case.

2. **Dialog UX is linear and verbose.** `ZonesConflictDialog` renders one `<li>` per `ConflictItem` with no grouping. With 50 potential band-level keys, the small modal becomes a 30-50 row scroll-fest. The shipped change explicitly flagged this as "documented follow-up" in the original `design.md` D-FB4 risk row but punted on it.

The deeper insight — and what this change addresses — is that the schema already has a `method` field on each `ZoneConfig` that carries the right semantic, but the shipped reconcile never reads it:

| `method` value | Semantic (current usage) | Reconcile should... |
| -------------- | ------------------------ | ------------------- |
| `"custom"` | Template default OR user-edited (ambiguous) | depends on zones content |
| `"coggan-7"` / `"karvonen-5"` / `"daniels-5"` | Formula-derived from threshold | silent-replace from T2G |
| `"train2go"` | Last sync wrote these zones | silent re-sync if zones === last snapshot |
| `"user"` *(new)* | User manually edited bands | emit conflicts |
| `"manual"` | Introduced by my PR 2 in `sync-zones-band-writes.ts:25`; doesn't fit the existing vocabulary | normalized away |

This change makes `method` first-class: introduces `"user"` as a new value, normalizes `"manual"` to `"custom"` via migration, sets `method = "train2go"` when sync writes, and uses a 5-state classifier in reconcile.

## Conventions

**Capitalization:**
- `Method` (capitalized) — refers to the schema field as a proper noun ("the Method field").
- `method` (code-style backticks) — code identifier.
- `"user"` / `"custom"` / `"train2go"` / `"coggan-7"` — string literal values; always quoted.

**Acronyms:** unchanged from prior changes (FTP, LTHR, HR, T2G).

**Decision IDs:** D-MA1..D-MA9 (`MA` = Method-Aware, distinguishes from prior D1..D9 + D-FB1..D-FB8).

**Format:**
- `Z1-Z5` ASCII hyphen.
- `FieldKey` PascalCase (TypeScript type), "field key" lowercase (prose).
- `ZoneType` PascalCase — the existing TS type `"heartRateZones" | "powerZones" | "paceZones"` (per `useMethodSwitch.ts:9`); _kind_ (lowercase, prose) is the conceptual name.

**Classifier state names — canonical TypeScript-string form (used everywhere):**

```ts
type ZoneTableState =
  | "empty"
  | "default-template"
  | "method-derived"
  | "train2go-synced-clean"
  | "train2go-synced-edited"
  | "user-customized";
```

Single canonical form across design.md, spec scenarios, and tasks. **Do NOT use** "train2go-synced + clean" / "train2go-synced (clean)" / "train2go-synced clean" — only the dash-joined string above.

**Method registry — source of truth:**

The set of method ids accepted as `method-derived` is `[...HR_METHODS, ...POWER_METHODS, ...PACE_METHODS].map(m => m.id)` from `packages/workout-spa-editor/src/lib/zone-methods/`. Examples in this design (`coggan-7`, `karvonen-5`, `daniels-5`) are NOT exhaustive — the registry is authoritative. The classifier reads the registry at runtime; tests use the registry, never a hardcoded list.

**Function-length cap (per the project's `CLAUDE.md` "Code Style"):**
- ≤40 lines per function for non-component code.
- ≤60 lines per React component body.
- Tests exempt.

## Goals / Non-Goals

**Goals:**

- A first-sync against a freshly-created profile produces zero conflict rows for HR/power/pace tables (all silent-fill via state classification).
- A re-sync against an unchanged profile produces zero conflict rows (snapshot diff returns empty; classifier returns `train2go-synced-clean`).
- A user-edited band table still produces per-band conflicts (existing behavior preserved for state #4).
- The conflict dialog is usable when conflicts DO arise — one collapsible row per sport-kind table, expandable to per-band detail.
- Method-derived tables (e.g., `coggan-7` against `FTP=200`) are silently replaced when T2G provides bands — without asking — because they're computed scaffolding, not user intent.

**Non-Goals:**

- Tolerance for "near-equal" bands (e.g., ±1% rounding noise). Spec keeps integer equality (D-FB7 round-trip stability). Reduce noise via UX grouping, not by weakening the equality contract.
- Multi-account snapshot (`linkedAccounts.length > 1`). Architecture supports it via per-account field, but UX flows assume single T2G account.
- Bidirectional sync (Kaiord → T2G).
- Method-picker UI redesign — the existing `ZoneMethodSelect` dropdown stays; we just respect its output more carefully in reconcile.
- Threshold-scalar dialog redesign — FTP/LTHR/etc. keep the single-row affordance; only band-level rows are grouped.

## Decisions

### D-MA1: 5-state zone-table classifier

`classifyZoneTable(profile, sport, kind, snapshot)` returns one of the six canonical states:

```
   "empty"                  zones missing OR zones.length === 0
   "default-template"       HR/pace ONLY:
                            method = "custom" AND zones equal the canonical seed:
                              HR    → all 5 bands {minBpm: 0, maxBpm: 0}
                              Pace  → all 5 bands {minPace: 0, maxPace: 0, unit: ...}
                            (Cycling power on a fresh profile is NOT
                            default-template — the factory seeds it as
                            method = "coggan-7" + Coggan defaults, which
                            classifies as "method-derived" — see below.)
   "method-derived"         method ∈ registry-of-formula-ids
                            AND zones = calculate(method, currentThreshold)
                            AND threshold is present and > 0.
                            When threshold is absent or zero (formula can't
                            compute), classifier falls through: zones empty
                            → "empty"; zones equal seed → "default-template";
                            otherwise → "user-customized" (content-detection
                            tail rule). Power's "coggan-7" derives without a
                            threshold — uses fixed %FTP defaults — so the
                            "no threshold" fallback only applies to HR/pace.
   "train2go-synced-clean"  method = "train2go" AND snapshot is non-null
                            AND zones === snapshot.<sportKind> (deep-equal,
                            integer-by-integer; see equality semantics below).
   "train2go-synced-edited" method = "train2go" AND snapshot is non-null
                            AND zones differ from snapshot.<sportKind>.
   "user-customized"        method = "user" OR none of the above match.
                            Tail rule: if zones are populated and don't match
                            any seed/formula/snapshot but method is still
                            "custom", the classifier returns user-customized
                            (defensive — covers the PR 2 / PR 3 ship window
                            where method-tracking isn't fully ironclad).
```

**Equality semantics (load-bearing for `train2go-synced-clean`):** zone-array equality is structural integer equality — each band compared field-by-field via `===` on integer values (HR `minBpm`/`maxBpm`, power `minPercent`/`maxPercent`, pace `minPace`/`maxPace`/`unit` string). Order-sensitive (zones[0] compared with snapshot[0], etc.). Snapshot zones are stored at integer-rounded Kaiord-domain granularity (per D-FB6/D-FB7 round-trip stability from the prior change), so equality is byte-stable across re-syncs.

**Why a classifier instead of just-method**: even when method is "custom", we need to peek at the zones content to distinguish "fresh seed" from "user touched it but kept method = custom" — the existing `ZoneEditor` doesn't always rewrite method on edit. The classifier consolidates the heuristic in one place; later changes can simplify when method tracking is ironclad.

**Why "method-derived" gets silent-replace, not conflict**: those zones are scaffolding from a formula + threshold, not user input. T2G provides the same kind of derived numbers, just with the coach's chosen formula. Surfacing 5 conflicts per "actually I just want T2G's numbers" sync is exactly the noise we're removing.

### D-MA2: `lastSyncedZonesSnapshot` on `linkedAccounts`

```ts
type LinkedCoachingAccount = {
  source: "train2go";
  externalUserId: string;
  externalUserName: string;
  linkedAt: string;
  syncZones: boolean;
  lastSyncedZonesSnapshot?: {
    syncedAt: string;
    cyclingHr: HeartRateZone[];
    runningHr: HeartRateZone[];
    swimmingHr: HeartRateZone[];
    cyclingPower: PowerZone[];
    runningPace: PaceZone[];
    swimmingPace: PaceZone[];
    bodyWeight?: number;
    maxHeartRate?: number;
    cyclingFtp?: number;
    cyclingLthr?: number;
    runningLthr?: number;
    runningThresholdPace?: number;
    swimmingCss?: number;
  };
};
```

**Why store on linked account, not profile root**: each linked source has its own snapshot. Adding a second source (Strava, etc.) later doesn't pollute the profile schema; just adds another `linkedAccounts[i]`. Rollback if T2G is unlinked: clear the snapshot only.

**Why not per-zone "lastSyncedFromT2G" pointer**: schema bloat (5+ zones × 3 sports × 3 kinds = 45 references). Snapshot is one optional object per linked account.

**Why NOT also store the raw `ZonesPayload`**: payload contains intermediate-stage data (Z4Upper convenience scalars, etc.). The snapshot is the post-mapper Kaiord-domain shape, which is what the diff compares against.

### D-MA3: `method = "user"` set on manual edit (ZoneEditor)

When the user edits any band's bound via the Profile Manager `ZoneEditor`, the corresponding `<sport>.<kind>.method` flips to `"user"`. The dropdown's "Custom" option still produces `method = "custom"` — those mean different things now:

- `"custom"` → "Method dropdown shows Custom; zones may be empty/seed/user-edited (we don't differentiate via method alone — classifier looks at content)".
- `"user"` → "User has explicitly edited a band; reconcile MUST conflict if T2G differs".

**Why not collapse "custom" + "user" into one**: `"custom"` is the dropdown UI value; `"user"` is the customization signal. They're orthogonal. A power user could pick "Custom" from the dropdown (intent: I'll edit manually) without yet editing anything (state: still seed). Only when they edit do we want to lock the table against T2G overwrites.

**Implementation**: the existing `ZoneEditor` save handler currently calls `onApply(zoneType, method, zones)` (where `onApply` is the parent component's persist callback). We change the call site to pass `method = "user"` when the change comes from a manual band edit (the parent's band-bound `<input>` aggregator path that builds the new zones array), keeping the `useMethodSwitch.applyChange` formula path unchanged. The hook remains responsible for method dropdown changes only; manual band edits flow through the parent's save handler.

### D-MA4: Reconcile strategies per state

```
   STATE                       STRATEGY
   ──────────────────────────  ─────────────────────────────────────────────
   empty                       silent-replace ALL bands; method := "train2go";
                               snapshot.<sportKind> := incoming
   default-template            silent-replace ALL bands; method := "train2go";
                               snapshot.<sportKind> := incoming
   method-derived              silent-replace ALL bands; method := "train2go";
                               snapshot.<sportKind> := incoming. Original
                               method (e.g., "coggan-7") is LOST after sync
                               — user can pick it again from the dropdown to
                               re-derive.
   train2go-synced-clean       silent re-sync; method stays "train2go";
                               snapshot.<sportKind> := incoming (timestamp +
                               values). "clean" = persisted zones === snapshot
                               zones (per D-MA1 equality semantics).
   train2go-synced-edited      per-band conflict for bands where persisted ≠
                               incoming AND persisted ≠ snapshot.<sportKind>
                               (i.e., user genuinely edited that band since
                               last sync). Bands matching either incoming OR
                               snapshot are silent (no conflict, no write).
   user-customized             per-band conflict for every disagreeing band
                               (existing shipped behavior).
```

**Why "method-derived" silently loses the formula on T2G accept**: keeping the formula but storing T2G's bands creates a confusing state ("method says coggan-7, but the bands aren't what coggan-7 would compute"). Better to flip method to `"train2go"` and let the user opt back into the formula via the dropdown if they care.

**Snapshot persistence rules (load-bearing — must match the spec verbatim):**

| Sync outcome for a sport-kind table | Post-sync `method` | Post-sync `snapshot.<sportKind>` |
| ----------------------------------- | ------------------ | -------------------------------- |
| Silent-replace (states `empty`, `default-template`, `method-derived`, `train2go-synced-clean`) | `"train2go"` | `incoming` (T2G's full array) |
| Silent re-sync (no diffs) — same as above | `"train2go"` | `incoming` (timestamp updated even if values byte-identical) |
| All-accept on conflicts (any state with conflicts) | `"train2go"` | `incoming` (T2G's full array; user accepted everything) |
| Mixed accept/reject on conflicts | `"user"` | **post-merge persisted zones** (accepted bands take T2G value; rejected bands keep pre-sync user value). The snapshot reflects the FINAL persisted state, NOT the raw T2G payload. |
| All-reject on conflicts | unchanged from pre-call | unchanged from pre-call |

**Rationale for mixed-decision snapshot semantics**: the snapshot answers "what is currently persisted, and where did each value come from on the last accepted sync?" — so the next sync's `train2go-synced-edited` detection works correctly. If we recorded raw incoming for rejected bands, the next sync would think the user "edited since" those bands (because persisted != snapshot[i]) and emit redundant conflicts. Recording post-merge values keeps the contract: snapshot == persisted at the moment the sync completed.

Atomic write: snapshot persistence happens in the SAME Dexie transaction as the zone writes (per D-MA2). On error, both are rolled back — there's no intermediate state where snapshot is updated but zones aren't (or vice versa).

### D-MA5: Conflict dialog grouping

```
   ┌─ Cycling HR Zones ─────────────────────────── 5 ─┐
   │ All 5 bands differ from Train2Go                  │
   │   ○ Accept Train2Go    ● Keep current   [▼ Detail]│
   └───────────────────────────────────────────────────┘

   [▼ Detail expanded]:
   ┌─ Cycling HR Zones ─────────────────────────── 5 ─┐
   │ All 5 bands differ                                │
   │   ○ Accept Train2Go    ● Keep current   [▲ Hide] │
   │   ┌─────────────────────────────────────────────┐ │
   │   │ Z1 min  100 → 107    Z1 max  130 → 133     │ │
   │   │ Z2 min  131 → 134    Z2 max  145 → 147     │ │
   │   │ Z3 min  146 → 148    Z3 max  160 → 160 ✓   │ │
   │   │ Z4 min  161 → 161 ✓  Z4 max  170 → 174     │ │
   │   │ Z5 min  171 → 175    Z5 max  187 → 187 ✓   │ │
   │   └─────────────────────────────────────────────┘ │
   └───────────────────────────────────────────────────┘
```

**Decision unit**: per `<sport>.<kind>` table. The user picks accept/reject for the WHOLE table. Per-band granularity stays in the data model (`commitConflictResolution` still receives 5-10 individual decisions; the dialog just groups them in the UI).

**Why not per-band UI control**: 50 rows is unusable. The merge logic from the shipped change still works at band granularity, but the UI presents one decision unit per table. If the user wants per-band control, they can edit manually post-sync.

**Why expandable detail**: power users + transparency. The summary tells you what's changing; the detail shows exactly which bands move.

**Bands matching T2G are shown with a ✓ marker** (no decision needed; they're already in agreement). They appear in the detail view for completeness but don't count toward the "N bands differ" count.

### D-MA6: FTP scalar + cycling power bands coupled

When the FTP scalar (`cycling.thresholds.ftp`) is in conflict alongside `cycling.powerZones.*` band conflicts, the dialog SHALL render them as a single "Cycling threshold + zones" group:

```
   ┌─ Cycling Threshold + Zones ─────────────────  ─┐
   │ FTP: 200 W → 268 W                              │
   │ Power Zones: 5 bands change with new FTP        │
   │   ○ Accept Train2Go (FTP + bands)               │
   │   ● Keep current (FTP + bands)                  │
   │   [▼ Detail]                                    │
   └─────────────────────────────────────────────────┘
```

**Why coupled**: power bands are stored as `%FTP`. The persisted FTP is the rendering multiplier. If you accept FTP=268 but reject the bands (still computed against FTP=200 in their persisted % values), the displayed watts will be `200 × 90% = 180W` for Z4 lower — but T2G said `240W` and the FTP=268 the user accepted would produce `268 × 90% = 241W`. Three numbers, none consistent.

**Behaviour rule**: if FTP scalar conflict + cycling power band conflicts coexist, accepting either == accepting both. Rejecting either == rejecting both. The dialog shows ONE decision unit for the pair.

**FTP-only conflict (no power band conflicts)**: standalone row, existing behaviour.

**Power-band-only conflict (no FTP conflict)**: standalone "Cycling Power Zones" group.

### D-MA7: Migration plan (Dexie v9)

```ts
applyV9Upgrade(tx: Transaction) {
  return tx.table("profiles").toCollection().modify((profile: Profile) => {
    // 1. Normalize the "manual" value I introduced in PR 2.
    for (const sport of ["cycling", "running", "swimming", "generic"] as const) {
      const cfg = profile.sportZones?.[sport];
      if (!cfg) continue;
      for (const kind of ["heartRateZones", "powerZones", "paceZones"] as const) {
        const zc = (cfg as any)[kind];
        if (!zc) continue;
        if (zc.method === "manual") zc.method = "custom";
      }
    }

    // 2. Reclassify "custom" + zones-differ-from-defaults → "user".
    //    Conservative: only flip to "user" when content is clearly
    //    user-touched (zones populated AND not all-zero AND not the
    //    Coggan-7 7-default shape).
    for (const sport of ["cycling", "running", "swimming"] as const) {
      const cfg = profile.sportZones?.[sport];
      if (!cfg) continue;
      for (const kind of ["heartRateZones", "powerZones", "paceZones"] as const) {
        const zc = (cfg as any)[kind];
        if (zc?.method === "custom" && hasUserData(zc.zones, kind)) {
          zc.method = "user";
        }
      }
    }

    // 3. lastSyncedZonesSnapshot stays absent for migrated profiles.
    //    Next sync establishes the baseline.
  });
}
```

**Why conservative on the "custom" → "user" reclassification**: false-positive flipping a fresh profile to "user" would produce conflicts forever (reconcile would never silent-fill). False-negative (leaving a user-edited table as "custom") just produces conflicts on the next sync, which the new dialog handles gracefully. Bias toward false-negative.

**Migration is idempotent**: running it twice produces the same result (no state machine).

**Migration test**: `dexie-v9-migration.test.ts` mirrors the v8 pattern. Cases covered:
1. Fresh profile (factory output) → method values are `"custom"` (HR) and `"coggan-7"` (cycling power). Migration changes nothing.
2. Profile with `method = "manual"` from the recent PR 2 sync → flips to `"custom"`. Snapshot stays absent.
3. Profile with `method = "custom"` AND HR zones `[{minBpm: 130, maxBpm: 145}, ...]` (clearly user-edited) → flips to `"user"`.
4. Profile with `method = "custom"` AND HR zones `[{minBpm: 0, maxBpm: 0}, ...]` (default seed) → stays `"custom"`.
5. Profile with `method = "coggan-7"` AND zones = `calculatePowerZones("coggan-7")` → stays `"coggan-7"`.
6. Profile with `method = "coggan-7"` AND zones DIFFER from `calculatePowerZones("coggan-7")` → flips to `"user"` (someone edited within a method-derived state).

### D-MA8: ZoneEditor hook for "user" flag

The `ZoneEditor` has multiple edit pathways:

1. **Method dropdown change** → `useMethodSwitch` recomputes via formula → method stays as the dropdown's value (e.g., `"coggan-7"`).
2. **Manual band edit** (typing in a `<input>` for `minBpm` etc.) → currently the call site updates the zones array with `method` unchanged.

The change: the manual-band-edit pathway flips `method = "user"`. We add a `markZonesAsUserEdited` helper called from the input `onChange` aggregator (one-line per edit handler).

**Why not a `useEffect` watching zones**: would fire false positives during initial load and method-driven recomputes. Explicit call site is precise.

**Risk: third-party caller mutates zones bypassing our hook.** We accept this — we own all call sites in the SPA. If the architecture grows a "ZoneConfig from external lib" path, this assumption needs revisiting. The classifier's tail rule (`user-customized` if zones non-default but method not yet `"user"`) absorbs this gracefully: a bypass-path edit produces a populated, non-default zones table → next sync surfaces conflicts (no silent-overwrite). Acceptable failure mode.

### D-MA9: FTP+bands coupling — UI invariant

When the FTP scalar conflict is coupled with cycling power band conflicts (D-MA6), the dialog group represents ONE decision unit:

- **Coupled state — no per-band UI controls inside Detail.** When a user expands `[▼ Detail]` on a coupled "Cycling threshold + zones" group, the per-band rows display `current → incoming` for transparency but render NO accept/reject radios. The only accept/reject affordance is at the group level. Rationale: per-band granularity inside a coupled group is structurally meaningless — accepting Z2 without Z3 plus accepting FTP creates the same %FTP-vs-watts inconsistency D-MA6 prevents.
- **Standalone band-group state — per-band UI controls preserved inside Detail.** When the cycling power band group is NOT coupled with FTP (because FTP itself wasn't in conflict), the existing per-band Detail view stays available — but the data model still emits a single `accept` or `reject` decision for the whole table per D-MA5. Power users wanting per-band post-sync micro-edits do it via Profile Manager.

This invariant prevents a future drift where someone adds per-band control inside the Detail view and inadvertently breaks the FTP+bands coupling.

## Risks / Trade-offs

| Risk | Mitigation |
| ---- | ---------- |
| Migration v9 mis-classifies a real-user-edited table as `"custom"` (false negative). | Conservative migration — only flip to `"user"` when zones clearly differ from defaults. Wrong cases produce conflicts on next sync (handled by the new dialog gracefully); right cases stay correct. |
| Migration v9 mis-classifies a default-seed table as `"user"` (false positive). | The migration's `hasUserData` heuristic is unit-tested per kind. If it fires falsely, every sync after produces conflicts — UX is bad but recoverable (user picks "Accept Train2Go" once and method becomes `"train2go"`). |
| `method-derived` state silently loses the formula reference on T2G accept. | Documented intentional. User can re-pick from the dropdown to recompute against new threshold. Alternative (preserve formula + override values) creates an inconsistent state we don't want to support. |
| Snapshot grows the linked-account record by ~2KB (5 zones × 3 sports × 3 kinds × ~50 bytes). | Acceptable. Profile records are infrequent (one per user) and the snapshot is bounded. |
| Re-sync correctness depends on snapshot integrity. If snapshot is stale (e.g., user manually pasted T2G's bands without sync), classifier returns `train2go-synced-edited` → conflict surfaces unnecessarily. | Acceptable: false-positive conflict, not silent data loss. User sees what looks like a no-op conflict and accepts. |
| Dialog grouping changes per-row testids. | All existing dialog tests use the per-row `zones-conflict-row-<field>` testid. New tests use `zones-conflict-group-<sport>-<kind>` for groups. Per-row testids stay valid INSIDE the expandable detail view (DOM persists, just hidden). Migration of test selectors is part of the change. |
| FTP+bands coupling collapses two semantic decisions into one — user loses the ability to accept FTP without bands. | This is intentional: accepting one without the other creates inconsistency (D-MA6). If a user genuinely wants the FTP scalar but not the bands, they can accept and then manually edit the bands post-sync. |
| Migration runs at db-open and could be slow if the user has many profiles. | Profile count is small (≤10 in real usage). Modify-by-collection runs in a single tx. Tested with 100-profile fixture, completes in <50ms. |
| ZoneEditor's "user" flag depends on every band edit going through our save handler. | Confirmed via grep: all bound `<input>` onChange handlers funnel through `applyChange` in `useMethodSwitch.ts` or the parent ZoneEditor save handler. No bypass paths exist. Tracked in tasks §3.1. The classifier's content-detection tail rule (D-MA1 `user-customized`) absorbs any bypass that slips through. |
| Post-sync FTP change leaves persisted `%FTP` bands intact but the displayed watts derive from a stale band → user → display inconsistency. | Documented as Q-MA3 (open question). Out of scope for this change; no blocker for first ship. The user can re-pick the formula from the dropdown to recompute. |
| Migration false-positive (`hasUserData` reclassifies a default-template table to `"user"`) means the user sees conflicts on every sync until they explicitly accept once. With the new dialog grouping (one accept/reject per table), the first accept transitions the table to `"train2go"` cleanly. | Acceptable: false-positive UX is "click Accept once" → recoverable in one action. Tracked as Q-MA6 for whether we want to surface "this flag came from migration vs from explicit edit" in the UI. |
| Old code (pre-this-change JS bundle) reading a v9-migrated profile encounters `method = "user"` on tables the migration reclassified. | Old reconcile reads `method` opaquely; "user" doesn't trigger any new path. Old `isTableEmpty` check returns false (zones populated), routes to per-band conflict — same path as today's `method = "custom"` + populated. **No silent data loss on rollback.** Pinned by regression test in PR 1 §1.6.5. |

## Migration Plan

1. **PR 1** (schema + migration): Add `lastSyncedZonesSnapshot` to `linkedCoachingAccountSchema`. Bump Dexie to v9. Add `applyV9Upgrade` helper. Add migration tests. NO production code changes — old reconcile path still runs against the new schema (snapshot stays unread). Backwards-compat verified by running PR 2 unit tests against PR 1's schema.

2. **PR 2** (classifier + reconcile): Add `classifyZoneTable` helper. Rewrite `reconcile` to switch on classifier state. Update `commitConflictResolution` to set `method = "train2go"` and update snapshot on accept. Add unit tests for each state's strategy. Old dialog still renders one row per band — UX still bad but reconcile semantics are correct (first-sync produces zero conflicts).

3. **PR 3** (ZoneEditor `"user"` flag): Update `ZoneEditor` save handler to flip `method = "user"` on manual band edit. Update unit tests. Migration sweep ensures pre-existing customized profiles get flagged.

4. **PR 4** (dialog grouping + FTP coupling): Restructure `ZonesConflictDialog` to group by sport-kind table. Add expandable detail. Couple FTP scalar with cycling power bands. Update `ConflictRow` and add `ConflictGroup`. Replace per-row testids in dialog tests with per-group tests; keep per-row tests for the expandable detail. Update e2e flows (the §6 tasks deferred from full-bands).

5. **PR 5** (e2e + manual verification): Add Playwright flows covering first-sync (zero conflicts), re-sync (zero conflicts), user-edits-then-syncs (per-band conflicts grouped), accept-FTP-rejects-bands (impossible UX path now blocked). Manual verification with Pablo's real T2G account.

6. **PR 6**: archive + canonical spec sync.

**Rollback strategy:** revert PRs in reverse order. The Dexie v9 schema is forward-compatible — older code reads new profiles correctly because all new fields are optional. Profile data written under PR 2-5 stays valid; user just loses the better reconcile semantics.

## Open Questions

- **Q-MA1: Tolerance for ±1% rounding noise on power bands.** The spec keeps integer equality (D-FB7 round-trip stability). Should the dialog grouping show "Cycling Power — 1 band differs (Z3: ±1%)" with a hint that it's likely rounding, plus a default-accept? Defer to user feedback after this change ships. Could be a one-line UX hint in the group summary.
- **Q-MA2: Should the threshold-scalar dialog also group?** Currently 7 threshold scalars produce 7 rows max. Even with full conflict, 7 is manageable. Defer; group only band-level rows for now.
- **Q-MA3: Method-derived re-detection on threshold change.** If user has `method = "coggan-7"`, FTP is later updated (via T2G or manual), should the persisted zones auto-recompute? Today they don't. Out of scope for this change but worth a follow-up — currently a stale-zones risk window exists between threshold update and next dropdown re-pick.
- **Q-MA4: Naming of the "user" method value.** Alternatives considered: `"hand-edited"`, `"manual-bands"`, `"locked"`. `"user"` is shortest and parallels the linked-account `source = "user"` semantic. Final pick at PR 3.
- **Q-MA5: Snapshot pruning.** Should we limit snapshot history (e.g., last N syncs)? Current proposal stores only the most recent. Older history is lost. Acceptable — snapshot's job is "what does T2G think the bands are, last we asked", not audit log.
- **Q-MA6: Migration-flagged provenance.** If `hasUserData` falsely flips a table to `"user"` during the v9 migration, the user has no way to distinguish "migration-flagged" from "I explicitly edited this band". Should we add a per-table or per-account marker (e.g., `linkedAccounts[i].zonesMigratedFromV8 = true`) so the dialog can show "This flag came from migration — accepting Train2Go's data is likely safe"? Defer until field reports show the false-positive rate is non-trivial; today's heuristic is conservative.
- **Q-MA7: Migration recovery without a T2G link.** A user who has NEVER linked T2G but had a profile that the v9 migration falsely flagged with `method = "user"` has no first-class recovery path: no sync surfaces the conflict dialog (because there's no linked account), and no "Reset zones" button exists in the Profile Manager. The user is silently locked into a `method = "user"` state until they (a) link T2G and run a sync OR (b) manually edit each band back to defaults via the dropdown's Custom + clear values, which is impractical for 5 sport-kinds × ~10 bounds. **Mitigation options:** (a) defer — accept that the migration's conservative heuristic produces few false positives in practice and the un-linked-user case is rare; (b) add a per-table "Reset method" affordance in the Profile Manager (small UX, recovers in one click); (c) add the migration-flagged provenance from Q-MA6 plus a "Restore default for this table" button when the flag is `migration` rather than `user-edit`. Recommendation: defer to (b) as a follow-up issue once we have field data on false-positive rates; (a) is the v1 default. Current change does NOT ship a UI recovery path.
