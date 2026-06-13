# Design: code-semantics-hardening

## Context

The semantic audit (snapshotted in `audit/`, five reports with file:line evidence) graded ten areas; this change drives all of them to A+. The findings cluster into four shapes: (a) a structurally weak CLI failure layer, (b) inconsistent lossy-conversion honesty across adapters, (c) domain rules duplicated as anonymous literals, and (d) small modeling/abstraction mismatches. Everything sits in the adapters and application layers; one new port appears in the SPA.

## Goals / Non-Goals

**Goals:**

- A single, typed CLI failure contract that distinguishes user error, environmental breakage, external-service failure, and unknown bugs — closing the class behind this week's CI incident.
- Every lossy adapter conversion announces itself; every assumed/fallback value has a name.
- Each duplicated domain rule (bpm offset, health version gate, undo window, retry policy) lives in exactly one named place.
- MCP errors become machine-branchable for agents.

**Non-Goals:**

- No new mechanical guards (the rules here are judgment-level; the spec scenarios are the contract).
- No KRD schema changes; branded/annotated units in core are documentation-level (JSDoc unit annotations), not type-system rework — full branded-types migration is explicitly deferred.
- No renumbering of existing CLI exit codes (additive only; scripts depending on current codes keep working).
- The SPA read-model port covers only the two audited hooks, not a blanket hooks migration.

## Decisions

### D1 — One CLI error mapper, typed errors, additive codes

Layer: `@kaiord/cli` adapters. Collapse `commands/convert/error-exit-code.ts`, `utils/error-exit-code.ts`, and the three `handle-error.ts` substring matchers into one `mapErrorToExitCode(error)` keyed on `instanceof`/`error.name` — never message text. Introduce typed errors where handlers currently throw raw `Error` with magic strings (e.g. `UnsupportedFormatError`, `DirectoryCreateError`, `EnvironmentError`). New codes appended to `EXIT_CODES`: `ENVIRONMENT_ERROR` (13) for missing bundled schema/dependency signatures (`MODULE_NOT_FOUND`, ENOENT on a path inside `node_modules`/package assets) with a "reinstall @kaiord/cli" hint, `SERVICE_ERROR` (14) for `ServiceApiError`/network failures with a "retry later" hint. `DIRECTORY_CREATE_ERROR` (12) becomes reachable via the typed error. _Alternative considered:_ keeping per-command mappers with a shared helper — rejected; the audit showed divergence is the failure mode, so single-sourcing is the point.

### D2 — CLI FORMAT_REGISTRY mirrors MCP's

Layer: `@kaiord/cli`. One `format-registry.ts` (name, extension, binary, description per format) feeds the zod enum, yargs `choices`, converter dispatch, extension detection, and every "Supported formats:" string. MCP's registry is the proven shape; the CLI gets its own copy rather than a shared package export because cli must not depend on mcp (and core should not carry CLI presentation strings). _Alternative considered:_ hoisting a shared registry into core — rejected: descriptions/binary-ness are surface concerns; duplication across two surfaces with identical shape is acceptable and each is internally single-sourced.

### D3 — Loss-honesty pattern: named constant + `logger.warn` + extension preservation

Layer: adapters (zwo, garmin, tcx, fit). The codified pattern (already exemplary in fit health converters and zwo's ramp branch): (1) every assumed or fallback value is a named module constant with a rationale comment (`ASSUMED_FTP_WATTS = 250`, `UNSUPPORTED_DURATION_FALLBACK_SECONDS = 300`, `GARMIN_STEP_NOTES_MAX = 256`); (2) every code path that drops/approximates emits `logger.warn("Lossy conversion: …", { context })`; (3) where the wire format cannot express a KRD concept, the value round-trips via the `kaiord:` extension namespace, and reader/writer modules carry a one-line header stating that purpose. zwo's `|| 0` restore coercions change to: attribute absent → restore as before; attribute present-but-unparseable → warn and restore `type: open` (a 0-bpm/0-watt duration is physiologically meaningless and hides corruption).

### D4 — Garmin REPS end-condition: explicit rejection, not silent `open`

Layer: `@kaiord/garmin`. The condition schema defines `REPS` but `mapConditionToDuration` silently collapses it to `open`. KRD has no reps-based duration today, so modeling it is out of scope; the decision is explicit honesty: warn ("Lossy conversion: reps end-condition not supported, treating as open") and document in the converter. If KRD later gains reps durations, the warning site is the marker. Same warn treatment for unknown condition/intensity/stroke defaults; the `im↔mixed` value-5 collision gets a comment declaring the collapse deliberate.

### D5 — `WorkoutSummary.sport` speaks KRD

Layer: `@kaiord/garmin`. `mapToWorkoutSummary` routes `sportTypeKey` through `mapGarminSportToKrd`. This changes visible list output (e.g. `cardio_training` → KRD vocabulary) — a behavioral fix, carried in the changeset as `fix(garmin)`. The port type stays `sport: string` (documented forward-compat).

### D6 — Core units: annotate now, brand later

Layer: `@kaiord/core` domain. Every bare physiological number in record/session/lap schemas gets a `/** watts */`-style JSDoc unit annotation (the discipline `lap.ts` already shows). Branded scalar types are deferred — they ripple through every adapter for documentation gain the annotations already deliver. The health version gate becomes one named export (`HEALTH_SCHEMA_VERSION` pattern/schema) imported by all six schemas. `validate-round-trip` methods rename to be honest about their port-level abstraction (`validateBinaryRoundTrip`/`validateKrdRoundTrip`), keeping deprecated aliases for one release since the package is published.

### D7 — MCP typed error payloads, additive

Layer: `@kaiord/mcp`. `formatError` gains a structured tail: `{ content: [{type:"text", text}], isError: true, _meta? }` — concretely, the error text stays first (human-readable) and a machine block is appended in the text as a fenced JSON `{ type, suggestion? }` OR via the MCP `structuredContent` field if the SDK version supports it (decide at implementation by SDK capability; prefer `structuredContent`). Error types reuse the CLI vocabulary (file-not-found, unsupported-format, validation, tolerance, auth, service, environment). `kaiord_get_recovery_status` adds `skipped`.

### D8 — SPA read-model port for matched sessions

Layer: SPA application/ports. Define `MatchedSessionsReadModel` port (application layer) with the `hydrate(matches)` join the hooks currently inline; implement with the existing Dexie tables (adapter), inject via the established persistence-provider pattern. Only `use-activity-match-state` and `use-matched-sessions-hydrate` migrate. Other audited SPA items are mechanical: shared `UNDO_DELETE_WINDOW_MS`/`CLEANUP_TICK_MS`, `extractStructuredWorkout` everywhere (grep gate: `structured_workout as Workout` count goes to 1), `ItemId` brand on create-step, auto-match constant — **decision needed from code truth**: keep the 0.6 score threshold as canonical (it ships today) and fix the comment to "score ≥ 0.6 (≈ ±40% duration variance)", introducing `SCORE_THRESHOLD` documentation rather than changing matching behavior. Changing match behavior to ±20% would alter user-visible matching and is out of scope.

### D9 — Sequencing and PR strategy

One branch off main (after archive PR #754 merges), commits grouped: (1) cli failure contract + registry, (2) loss-honesty sweep (zwo/garmin/tcx), (3) shared constants (fit/core/garmin-connect), (4) core modeling + mcp, (5) spa, (6) ai + misc renames. Every commit green; new warning branches get tests (AAA, "should " titles); coverage non-decreasing per package. Changesets: `fix(garmin)` for the sport mapping, `feat(cli)` for new exit codes (additive), patch elsewhere.

## Risks / Trade-offs

- [New exit codes break script consumers] → additive only; existing codes unchanged; documented in CLI help/changelog.
- [Warn-noise from new lossy warnings in batch conversions] → warnings go through the injected logger at `warn` level; batch mode already aggregates; no behavioral gate.
- [`WorkoutSummary.sport` change surprises a consumer] → changeset `fix` + note; the raw key was never KRD vocabulary, so consumers treating it as such were already broken.
- [zwo restore change (`|| 0` → warn + open) alters round-trip output for corrupted attributes] → only triggers on malformed extension data; valid round-trips unchanged; covered by new tests.
- [Renames (`*-walker` → `*-decoder`, round-trip methods) churn imports] → TS-aware renames, deprecated aliases for the published core API for one release.

## Migration Plan

No breaking changes. Deprecated aliases for renamed core round-trip methods removed in the next major. Rollback is per-commit revert.

## Open Questions

- MCP structured errors: `structuredContent` vs fenced-JSON-in-text — resolve at implementation against the installed MCP SDK version (prefer `structuredContent` when available).
- `ENVIRONMENT_ERROR`/`SERVICE_ERROR` numeric values (13/14 proposed) — confirm no collision with reserved shell semantics in the existing `EXIT_CODES` table before fixing the numbers.
