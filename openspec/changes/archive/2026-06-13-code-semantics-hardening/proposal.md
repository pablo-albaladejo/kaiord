> Completed: 2026-06-13

# Proposal: code-semantics-hardening

## Why

A five-agent semantic audit of all production code (evidence in `audit/`, per-finding file:line) found the codebase speaks the fitness domain well but unevenly: grades range from A− (mcp, ai, garmin-connect, fit, spa) down to **C+ for the CLI**, whose failure-language layer turned a missing bundled schema into an opaque `exit 99` during a real CI incident this week. The recurring defect shape is "the code knows the rule but doesn't say it": domain rules encoded as anonymous literals (`250` assumed FTP, `+100` bpm offset, `/^2\.\d+$/` ×6), lossy conversions that warn in one branch but stay silent in their structural twin, and one outright doc-vs-code divergence (auto-match comment promises ±20% variance; the code allows ≈±40%). This change raises every audited area to A+.

## What Changes

- **CLI failure semantics (critical).** One name/instance-based exit-code mapper replaces the two divergent mappers and the three `handle-error.ts` message-substring matchers; new `ENVIRONMENT_ERROR` (missing bundled schema/dependency → reinstall hint) and `SERVICE_ERROR` (Garmin API/network) exit codes; the defined-but-dead `DIRECTORY_CREATE_ERROR` becomes reachable; a CLI `FORMAT_REGISTRY` becomes the single format vocabulary source (roster currently duplicated ~8×).
- **Lossy-conversion honesty, cross-adapter.** zwo: the steady-state watts→%FTP branch warns like its ramp twin; `ASSUMED_FTP_WATTS` and `UNSUPPORTED_DURATION_FALLBACK_SECONDS` named; `|| 0` restore fallbacks stop masking absent round-trip attributes. garmin: step-notes truncation warns with named limits (resolving the 255/256 off-by-one), unknown condition/intensity/stroke defaults warn, the unhandled `REPS` end-condition is decided (modeled or explicitly rejected), the `im↔mixed` FIT-value collision and faster-first wire convention are documented, and `WorkoutSummary.sport` routes through `mapGarminSportToKrd` instead of leaking the raw Garmin key. tcx/zwo: the 7-value intensity enum no longer narrows to 4 silently — full mapping where the format allows, named lossy warning where it does not.
- **Shared named constants for duplicated rules.** fit: bpm `+100` offset extracted to shared hr-helpers (mirroring `power-helpers.ts`), zone bounds (7/5/5) named, `fitTimestampToIso` helper replaces 7 copies of `* 1000` branching. core: the health v2.x version regex named once (6 copies today). garmin-connect: retry policy constants named (429/5xx/retries/backoff), `nowEpochSeconds()` helper, stray workout URL moved to `urls.ts`.
- **Core modeling.** Unit annotations (or branded types) for the bare-number record/session/lap fields; `validate-round-trip` API renamed to match its real abstraction (FIT-named methods under a generic banner today); `extract-workout` error message domain-phrased.
- **MCP machine-readable errors.** Tool error payloads gain a typed `type` (and `suggestion` where known) so agents can branch on failure cause; `kaiord_get_recovery_status` gains the `skipped` field for health-family parity.
- **SPA logic-layer polish.** `UNDO_DELETE_WINDOW_MS` shared across the three sites that must agree; the 18 scattered `as Workout` casts routed through `extractStructuredWorkout`; create-step id branded as `ItemId`; the auto-match doc/code divergence resolved with a named variance constant; raw Dexie joins in two hooks lifted behind a read-model port.
- **ai + misc.** Dead `minPercent`/`maxPercent` eval fields removed; `ZONE_TOLERANCE` named; tcx `*-walker` converters renamed `*-decoder` (they decide semantics, not traversal); `kaiord:` extension namespace purpose headers added; FNV constants named in `profile-snapshot`.

No public API behavior changes except: new CLI exit codes (additive), richer MCP error payloads (additive fields), and `WorkoutSummary.sport` now carrying KRD vocabulary instead of raw Garmin keys (flagged as a fix).

## Capabilities

### New Capabilities

- `conversion-loss-honesty`: every adapter conversion that drops, approximates, or substitutes data SHALL announce it — a named warning at the point of loss, a named constant for every assumed/fallback value, and round-trip preservation via extensions where the wire format cannot express the concept.
- `failure-semantics`: the user/agent-facing failure contract — the CLI SHALL classify failures into semantic exit codes (user error vs environmental vs external-service vs unknown) via a single typed mapper, and MCP tools SHALL return machine-readable error payloads an agent can branch on.

### Modified Capabilities

- `adapter-contracts`: adds the intensity round-trip requirement — adapters SHALL map the full 7-value KRD intensity vocabulary where the format allows it and emit a named lossy warning where it does not, instead of silently narrowing.

## Impact

- **Packages:** `@kaiord/core`, `@kaiord/fit`, `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/ai`, `@kaiord/cli`, `@kaiord/mcp`, `@kaiord/workout-spa-editor`.
- **Hexagonal layers:** adapters and application; one SPA read-model port is introduced (port interface defined before the Dexie-backed adapter that implements it). No domain-type breaking changes; branded/annotated units are additive.
- **Public surfaces:** CLI exit codes additive (existing codes keep their meaning); MCP error payloads additive; `WorkoutSummary.sport` value change is a behavioral fix (changeset `fix`).
- **CI:** no new mechanical guards required; existing guards (converter tests, AAA/title, barrel suites) cover the refactors. Coverage thresholds must hold; new warning branches need tests.
- **Risk:** wide but shallow — most items are rename/extract/comment-level with tests pinning behavior; the CLI mapper unification is the only structural rework and is fully covered by the existing integration suite plus new exit-code scenarios.
