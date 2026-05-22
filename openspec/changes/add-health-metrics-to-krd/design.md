## Context

The Kaiord ecosystem is workout-centric at every architectural layer. The deep-dive trace (`.omc/specs/deep-dive-trace-add-health-metrics.md`) confirmed that:

- `packages/core/src/domain/schemas/file-type.ts:3-7` defines `fileTypeSchema` as a closed `z.enum(["structured_workout","recorded_activity","course"])`.
- `packages/core/src/domain/schemas/krd/metadata.ts:32` requires `sport: z.string()` unconditionally.
- `packages/core/src/domain/schemas/krd/index.ts` admits arbitrary keys via `extensions: z.record(z.string(), z.unknown())`. Two namespaces are already in active production use: `extensions.structured_workout` (set by every workout-emitting adapter) and `extensions.course` (set by the GPX/course pipeline). The SPA editor narrows the open extensions back to a tagged shape at the type-system layer in `packages/workout-spa-editor/src/types/ui-workout.ts:42-43`.
- `packages/core/src/ports/format-strategy.ts:6-21` types every reader/writer to KRD; there is no second canonical format.
- `packages/fit/src/adapters/shared/message-numbers.ts:6-10` registers only `FILE_ID(0)`, `WORKOUT(26)`, `WORKOUT_STEP(27)`. The grouping helper at `packages/fit/src/adapters/messages/messages.mapper.ts` silently drops every other message via a null-check on the looked-up key (no error, no warning).
- The FIT SDK exposes — but Kaiord does not handle — `weight` (file type 9), `monitoringA` (15), `monitoringDaily` (28), `monitoringB` (32), and the messages `sleep_level`, `monitoring`, `monitoring_info`, `weight_scale`, `body_composition`, `hrv`, `stress_level`.
- TCX, ZWO, and GCN are workout-only by their respective specs. TCX/GCN readers hardcode `type: "structured_workout"` and reject any non-workout payload with a parsing error; their writers throw a generic `Error` on unknown `krd.type`.
- The SPA shell has no primary navigation surface (no sidebar, no tab bar). Routes are flat in `AppRoutes.tsx:33-66`. The header `LayoutHeader.tsx:15-35` carries only the logo and status block. Adding health routes that the user can discover requires introducing a primary navigation surface for the first time.
- Dexie has reached schema v13 in `dexie-schemas.ts:46-59`; prior migrations all add columns or indexes to existing tables, never new tables. v14 in this change is the first migration to introduce six new tables in one upgrade.
- `@kaiord/garmin-connect`, `@kaiord/garmin-bridge`, and `@kaiord/train2go-bridge` are intentionally not in scope (decision Q5 of the deep-dive interview deferred GCN health endpoints to a follow-up issue).

The decisions below are derived directly from the deep-dive spec (`.omc/specs/deep-dive-add-health-metrics-to-krd.md`), which crystallised ambiguity to ~12% across seven Socratic questions.

## Goals / Non-Goals

**Goals:**

- KRD becomes the canonical contract for the six new health domains (sleep, weight, HRV, daily wellness, body composition, stress) so any future health-data adapter can target a single schema.
- FIT round-trips the six health types end-to-end at parity with current workout round-trip semantics, with explicit tolerances per metric.
- TCX, ZWO, and GCN declare workout-only partial coverage at compile time (typed error class) so consumers cannot accidentally lose health data without a build-time signal.
- The SPA grows a Training / Health / Settings primary navigation surface and ships five routed health pages, preserving the existing surface-classification invariants (routed-page focus management, live-announcer, no dual mounts).
- Dexie v14 lands six health stores that mirror the KRD `extensions.health.*` shape one-to-one, so live-queries can read persisted health data without intermediate shape translation.
- The MCP server exposes the new health domain to AI workflows (e.g., recovery-aware workout suggestions) via at least five new tools.
- The breaking changes from KRD v1 → v2 are documented with a clear migration path in `docs/krd-format.md` and published as `major` changesets across every affected package.

**Non-Goals:**

- Garmin Connect HTTP integration for health endpoints (`/wellness-service/wellness/*`, `/sleep-service/sleep`, `/weight-service/weight`, `/hrv/*`, `/stress/*`). Tracked as a follow-up issue. `@kaiord/garmin-connect` is unchanged by this proposal.
- Garmin browser-bridge extension scraping of `connect.garmin.com/wellness/*` pages. Tracked as a follow-up.
- Write-back of weight (or any health metric) to Garmin Connect. Tracked as a follow-up.
- Non-Garmin health-data sources (WHOOP, Oura, Apple Health, Strava wellness). The `health-data` capability is structured so each source becomes a separate adapter package later; only `@kaiord/fit` is the bidirectional implementation now.
- Additional Garmin health metrics beyond the initial six (blood oxygen, body battery, respiration rate, glucose). Their FIT messages exist but are deferred to a later additive change that does not need to bump the KRD major.
- Analytics / trends UI (correlations between sleep and TSS, weight trends, etc.). The Health Hub MVP is informative-only.
- A new generic `HealthMetricRepository` polymorphic table. Decision 4 below explicitly chooses one Dexie store per metric.

## Decisions

### Decision 1: KRD becomes the universal canonical format for Garmin data, not a parallel `KHM` format

**What:** Extend KRD v1.0 → v2.0 in place. Health metrics are full first-class `type` values in the same `fileTypeSchema`, sharing the same root document shape, the same `metadata` block (with `sport` relaxed to optional), and the same `extensions` namespace. There is no second canonical format and no second set of reader/writer ports.

**Why:** The trace identified this as the gating decision (Lane 2 critical unknown). The deep-dive interview Q1 chose "KRD universal Garmin". The principal alternative — creating a parallel `@kaiord/health-core` package with its own ports, use cases, and adapter contracts — would duplicate the entire `application/`, `ports/`, and `adapters/logger` surface and force every consumer (SPA, MCP, CLI) to know about two canonical formats. The `course` precedent already establishes that the same canonical format can carry non-workout payloads inside `extensions.<namespace>`; this change applies the same pattern at scale.

**Layer:** Domain (new sub-schemas) + ports unchanged (`BinaryReader → KRD` keeps the same return type) + adapters (FIT extended, TCX / ZWO / GCN constrained).

**Alternatives considered:**

- **Parallel canonical format (`KHM` / `KaiordHealthMetrics`)** with its own ports. Rejected: doubles every entry point in `application/` and forces consumers to dispatch by canonical format. The trace called out the duplication cost explicitly.
- **Skip canonical altogether for health; pipeline FIT → Dexie laterally without KRD.** Rejected: breaks the existing rule in `openspec/specs/krd-format/spec.md:12-13` ("All format conversions SHALL use KRD as the intermediate representation"). Loosening that rule for health weakens the architectural guarantee elsewhere.
- **`extensions` escape hatch only, with no new `type` values.** Rejected: callers cannot dispatch on type without inspecting an extension, which leaks adapter-level concerns into application code.

### Decision 2: Health payloads live in tagged `extensions.health.*` namespaces, not as new top-level KRD sections

**What:** Add six discriminated members under `extensions.health.*` (`sleep`, `weight`, `hrv`, `daily`, `bodyComposition`, `stress`). Each sub-schema is tagged Zod (e.g., `z.object({ kind: z.literal("sleep"), … })`). The existing `sessions`, `laps`, `records`, `events` arrays stay shaped as today and remain empty for the six new `type` values, mirroring the `course` precedent. The `extensions` field is re-typed from `z.record(z.string(), z.unknown())` to a discriminated union that admits the reserved health namespaces, the existing reserved namespaces (`structured_workout`, `fit`, `course`, `course_points`), and `z.record(z.string(), z.unknown())` for unknown forward-compatible namespaces.

**Why:** Interview Q2 explicitly chose "namespace tipado en `extensions.health.*`". Adding six top-level sections (`sleepSessions`, `dailyWellness`, …) would inflate `krdSchema` root by ~6 large optional arrays, force every existing reader/writer to handle empty fields, and create two patterns side-by-side ("workout-shaped" vs "health-section-shaped"). Routing health through `extensions` keeps the root schema stable and reuses the convention the project already documents in `openspec/specs/krd-format/spec.md:98-109`.

The known cost is that consumers must narrow `extensions.health.*` with type guards — which is what `packages/workout-spa-editor/src/types/ui-workout.ts:42-43` already does for `extensions.structured_workout`. We accept that cost. If it scales poorly later we can refactor to top-level sections in a hypothetical v3.0.

**Layer:** Domain. The port layer is unchanged.

**Alternatives considered:**

- **Six new top-level sections on `krdSchema`.** Rejected per the rationale above (root inflation, dual pattern).
- **Hybrid: top-level sections for time-series (sleep, monitoring); `extensions` for scalars (weight, hrv summary).** Rejected: requires every reader of `krdSchema` to learn two conventions for "where does the data live". The trace flagged this as a documentation tax.
- **Untagged `extensions.health` shaped as a record of records.** Rejected: loses Zod discriminated-union exhaustiveness checks, which is exactly the type-safety benefit the project wants.

### Decision 3: `metadata.sport` becomes conditionally optional, gated by `type` via Zod refinement

**What:** Change `KRDMetadata.sport` to `z.string().optional()` and attach a `superRefine` on `krdSchema` that requires `metadata.sport` to be a non-empty string when `type ∈ { structured_workout, recorded_activity, course }`. For the six new health types, `metadata.sport` SHALL be absent (or empty); a health KRD carrying a `sport` value fails validation with a descriptive error.

**Why:** The trace identified `metadata.sport: z.string()` unconditional required as a concrete blocker for any non-workout `type`. Two alternatives existed: make `sport` plain optional (the v1.0 contract loosens for everyone, weakening guarantees for workouts) or refine by type (the contract for workouts stays exactly as today and the new types pay a different invariant). The refinement keeps the v1.0 invariant for legacy KRD payloads byte-equivalent and exposes the breaking change only to consumers that handle the six new types.

**Layer:** Domain (schema refinement).

**Alternatives considered:**

- **Plain `sport: z.string().optional()`.** Rejected: every workout-consuming code path then has to defend against absent `sport`, but in practice it must always be present.
- **Add `metadata.sport: "none"` (sentinel value).** Rejected: leaks a magic string into producers and consumers; ergonomically worse than absence.

### Decision 4: One Dexie store per health metric, mirroring `extensions.health.*` one-to-one

**What:** Dexie v14 introduces six new stores (`healthSleep`, `healthWeight`, `healthHrv`, `healthDaily`, `healthBodyComposition`, `healthStress`), each keyed by `id` with secondary indexes `[profileId+date]` and `date`. Persisted rows are the same shape as the corresponding `extensions.health.*` payload — no flattening, no JSON column, no polymorphism. Each store gets a typed `HealthXxxRepository` on `PersistencePort` and a matching `InMemoryHealthXxxRepository` in the in-memory adapter.

**Why:** Interview Q6 explicitly chose "espeja KRD 1:1". A single polymorphic `healthMetrics` table with a `type` discriminator and a `payload` JSON column would minimise migration churn but would require every consumer to filter by `type` first and would lose Dexie index typing. Mirroring KRD makes every live-query trivially typed, makes `useLiveQuery` results immediately consumable in JSX, and aligns with the existing project pattern (workouts, templates, coaching activities all have dedicated stores). The migration cost is "one big v14" instead of "six small migrations"; the deep-dive interview accepted this trade-off.

**Layer:** Adapter (Dexie) + port (six new repository interfaces).

**Alternatives considered:**

- **Polymorphic `healthMetrics` store with `type` + `payload`.** Rejected per the rationale above.
- **Hybrid: dedicated stores for time-series (sleep), polymorphic for scalars (weight, body composition).** Rejected for the same documentation-tax reason that killed the equivalent KRD-shape hybrid in Decision 2.

### Decision 5: TCX / ZWO / GCN writers throw a typed `UnsupportedKrdTypeError`, not a generic `Error`

**What:** Add a new error class `UnsupportedKrdTypeError extends Error` in `packages/core/src/domain/errors/unsupported-krd-type-error.ts`. The TCX, ZWO, and GCN writers SHALL throw this error (with the offending `krd.type` and the adapter name in the message) when given a KRD whose `type` is one of the six new health variants. Their readers SHALL never produce a health `type` value.

**Why:** The current behaviour is a `throw new Error("Unsupported FIT file type: …")` style that loses type information and forces consumers into string-matching. Typing the error lets the SPA import flow `instanceof`-check it and route the user to the health pipeline instead of the workout one. It also lets the `ADAPTER-COVERAGE.md` document name the contract precisely. The decision deliberately does **not** make these adapters silently skip health payloads — silent loss is the failure mode the trace called out as the current de-facto behaviour, and we are reversing it.

**Layer:** Domain (error class) + adapter (writer dispatch).

**Alternatives considered:**

- **Silently drop health types in workout-only writers and emit a warning.** Rejected: data loss without a typed signal makes consumer code unsafe.
- **Make the writers no-ops that emit an empty workout file.** Rejected: corrupts downstream pipelines that assume a non-empty payload.
- **Move workout-only adapters behind a different port (`WorkoutBinaryWriter` vs `KrdBinaryWriter`).** Rejected: doubles the port surface for a small expressiveness gain; typed errors achieve the same enforcement at the call site.

### Decision 6: Introduce a primary navigation surface (Training / Health / Settings tab bar) instead of redesigning the route hierarchy

**What:** Add a primary tab bar (or sidebar — implementation detail to be decided in `tasks.md` §6) bracketing the SPA shell under the existing header. Three tabs: `Training` groups the existing four workout routes (`/calendar`, `/library`, `/workout/new`, `/workout/:id`), `Health` groups the five new routes, `Settings` opens the existing meta modal (no URL). URLs of existing routes stay unchanged so existing bookmarks and deep links continue to work.

**Why:** Interview Q3 chose "Health Hub completo" (the user actively manages health in the SPA, not just consumes it as background context). The trace flagged that the existing shell has no primary navigation surface (`LayoutHeader.tsx:15-35`), so adding new routes without a navigation surface would leave them undiscoverable. Grouping existing workout routes under `Training` keeps the conceptual model symmetric (Training mirrors Health), and the surface-classification invariants from `spa-routing` (routed-page focus management, live-announcer, no dual-mount) carry over without modification.

**Layer:** SPA template layer (no domain or port changes).

**Alternatives considered:**

- **Sidebar navigation.** Defer between tab bar and sidebar to `tasks.md` (CSS / responsive decision, not architectural). Both satisfy the surface contract.
- **No primary navigation; surface health via deep-linked entries from the calendar.** Rejected: violates the Q3 product identity decision (Health Hub means primary discoverability).
- **Reuse the existing Settings modal pattern for health.** Rejected: meta modals are for preferences, not content destinations; spa-routing already classifies the difference.

### Decision 7: FIT is the only bidirectional adapter for health in this change; the others are partial by spec

**What:** Document the format × KRD-type coverage matrix as a normative artefact in `packages/core/docs/ADAPTER-COVERAGE.md` and reflect it in the `adapter-contracts` spec delta. The matrix:

| Format | structured_workout | recorded_activity | course     | health (×6) |
| ------ | ------------------ | ----------------- | ---------- | ----------- |
| FIT    | read+write         | read+write        | read+write | read+write  |
| TCX    | read+write         | read+write        | n/a        | reject      |
| ZWO    | read+write         | n/a               | n/a        | reject      |
| GCN    | read+write         | n/a               | n/a        | reject      |

Cross-format round-trip tests SHALL exist only where both source and target are `read+write`. There is no round-trip test for FIT health → TCX or FIT health → GCN; the writers throw `UnsupportedKrdTypeError` if asked.

**Why:** The trace's Lane 2 hypothesis H2a was confirmed: today's behaviour is partial coverage by accident (silent discard). This decision converts the accident into an explicit contract. The matrix is the artefact that lets future contributors know whether a new health-aware feature can target a given format pair.

**Layer:** Documentation + spec (`adapter-contracts`).

**Alternatives considered:**

- **Best-effort writers that emit empty workout shells.** Rejected per Decision 5 rationale.
- **Add a TCX `<Extensions>` block for health.** Rejected: TCX spec does not standardise health extensions; we would be inventing a private dialect that no other tool reads.

### Decision 8: KRD v2.0 is a major breaking change with a documented migration path, not a backwards-compatible v1.1

**What:** Bump `version` in every produced KRD from `"1.0"` to `"2.0"`. Publish `major` changesets for `@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/mcp` (transitively breaking because it exposes the extended KRD shape through new tools and depends on `@kaiord/core@2.0.0`), and `@kaiord/workout-spa-editor` (private but bumped for hygiene). Add a "v2.0 migration" section to `docs/krd-format.md` listing the three breaking changes (extended `type` enum, conditional `metadata.sport`, tagged `extensions`) and noting the MCP-tool surface that grows in this release.

**Why:** Interview Q7 explicitly chose B (major v2.0). External consumers that validate KRD via Zod with `sport` required will fail-fast on the six new types; that is the correct behaviour because their assumptions no longer hold. A backwards-compatible v1.1 with conditional shaping (option Q7-D) would hide the change behind a refinement and create silent divergence between consumer-validated KRDs (workout-only) and producer-emitted KRDs (which now include health). Clean breakage with a migration guide is honest.

**Layer:** Process (changesets + docs).

**Alternatives considered:**

- **v1.1 additive only (option Q7-A).** Rejected: existing `metadata.sport: z.string()` consumers fail on health KRDs without warning. The version number lies.
- **v2.0 of a parallel `KRD-Health` capability, keeping `@kaiord/core` at v1.x (option Q7-C).** Rejected as part of Decision 1.

## Risks / Trade-offs

- **[Risk]** Six tagged sub-schemas under `extensions.health.*` are forward-additive but cannot remove fields without a v3.0. → **Mitigation:** add a `version: "2.0"` field inside each sub-schema as a forward-compatible additive marker so a hypothetical v2.1 sub-schema can add fields without bumping the canonical KRD version. The fields-can-only-grow rule is acceptable for an MVP and matches the FIT SDK's own additive evolution pattern.
- **[Risk]** Dexie v14 introduces six new stores at once. If the migration fails partially (one store created, IDB quota error before others), the database is in a half-migrated state. → **Mitigation:** Dexie v14 declaration is atomic at the `db.version(14).stores({…})` call; either the schema upgrades fully or the upgrade transaction aborts and Dexie restores v13. The migration adds no data, only schema, so an aborted upgrade is recoverable without intervention. Add an integration test that simulates upgrade abort and verifies v13 is restored.
- **[Risk]** The Training / Health / Settings tab bar is the first piece of primary navigation in the SPA shell. CSS / responsiveness decisions could conflict with the existing `MainLayout` constraints (`max-w-7xl`, header height). → **Mitigation:** treat the tab bar as a separate component that mounts below the header and above the route outlet; the existing layout stays unchanged. Add screenshot tests at the two responsive breakpoints (mobile / desktop) to catch overlap regressions.
- **[Risk]** FIT health fixtures vary across firmware versions; a fixture from one watch model may not round-trip identically to a fixture from another. → **Mitigation:** ship one canonical fixture per metric harvested from a single Garmin device + firmware combo, document the source in the fixture file's metadata, and treat divergence in CI as a per-device tolerance problem rather than a spec bug.
- **[Risk]** The MCP tools expose health data to LLMs. PII surface area grows (sleep schedules, weight, HRV — all biometric). → **Mitigation:** the MCP server runs locally and the user owns the data flow; no remote PII transmission is introduced. Add the standard `[PII] no interpolation in console/toast` mechanical guard coverage to any new SPA code paths that surface health data (the existing R-PIIInterpolation rule already runs in CI).
- **[Trade-off]** This change is large by Kaiord's archive precedent (the largest recent archives touch 1-2 capabilities; this touches 5). → **Acceptance:** the deep-dive interview explicitly rejected the "1 metric end-to-end first" option in Q4 ("decide scope tras prototipo de 1 métrica") in favour of "set completo Garmin daily" precisely to avoid 6 cycles of schema-migrate-schema. The size is the deliberate trade.
- **[Trade-off]** Six FIT mapper pairs is a lot of boilerplate at first. → **Acceptance:** each mapper is small and parallel-implementable; the `tasks.md` orders them with one TDD slice per metric so the work can be checkpointed at each green test.

## Migration Plan

The Kaiord internal pipeline migrates atomically: every package bumps to its new major version in the same release. The migration concerns external consumers of `@kaiord/core` who validate or produce KRD outside this repository.

**Required external migrations:**

1. **Consumers that parse KRD with `metadata.sport` assumed required**: must either restrict their parser to `type ∈ { structured_workout, recorded_activity, course }` or upgrade to `@kaiord/core@2.0.0` and use the new conditional refinement. A code example in `docs/krd-format.md` shows the migration.
2. **Consumers that pattern-match on the `type` discriminator**: the enum gained six variants. Pattern matches that handle unknown cases will continue to work (and should already have a default branch); explicit closed switches MUST add the six new cases or fall through to a no-op.
3. **Consumers that read `extensions.health.*`**: previously this key did not exist and consumer reads against it returned `undefined`; now it is a typed payload. No removal; consumers continue to receive `undefined` for old workout KRDs and a typed payload for new health KRDs.

**No automated migration is required for stored data.** Existing FIT files on disk are unchanged. Existing KRD documents validate as `version: "1.0"` and the v2.0 Zod schema is strictly more permissive (every v1.0 doc still validates) for the three legacy `type` values. Producers of v2.0 KRD emit `version: "2.0"`; consumers can discriminate by version field if they need to.

**Dexie migration on first SPA load after the v14 build ships:** Dexie automatically upgrades the user's local IDB from v13 to v14. The upgrade adds six empty stores; no existing data is read or rewritten. First-time load after upgrade is a single transaction.

## Open Questions

- **Should the Training / Health / Settings surface be a top tab bar, a left sidebar, or a bottom nav on mobile?** Deferred to `tasks.md` §6 as a UX decision. The architectural contract (it is a primary navigation surface bracketing the route outlet) is fixed; the visual treatment is not. Decide during implementation by prototyping both against the existing `MainLayout` constraints.
- **Should we ship a fixture per Garmin firmware version, or one fixture per device class?** Defer: start with one canonical fixture per metric, then expand if round-trip tests reveal firmware-version drift. Track expansion via a follow-up issue.
- **Does `extensions.health.*` need a per-sub-schema `version` field for additive evolution within v2.x?** Default to **yes** to keep options open; the Risks §1 mitigation already plans for it.
- **What is the exact tolerance for `daily_wellness.steps`?** Default to **exact (±0)** because step counts are integers and FIT round-trip should be lossless; revisit if a fixture proves otherwise.
- **Should the FIT `file_type` 32 (`monitoringB`) be merged into `daily_wellness` or kept as a separate KRD type?** Defer: start by merging both monitoring file types into `daily_wellness`; if a downstream consumer needs to discriminate, add a sub-schema discriminator within the daily payload in a future minor version.
