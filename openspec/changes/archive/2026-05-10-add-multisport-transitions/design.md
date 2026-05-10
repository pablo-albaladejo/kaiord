## Context

Garmin Connect supports multisport workouts (e.g., triathlon, brick) where a single workout contains multiple `workoutSegments`, each with its own `sportType`. Transitions between segments of different sports are toggled by a root-level `isSessionTransitionEnabled: boolean` flag.

Empirical spike against Garmin Connect's authenticated API on 2026-05-09 (workout IDs `1562019589`, `1562037033`) revealed three pieces of undocumented behavior that are critical for any GCN producer:

1. **Implicit transitions, not explicit segments.** Garmin does **not** expose a `transition` sport type. Transitions are activated workout-wide by `isSessionTransitionEnabled: true` at the root, and the user advances them via the lap button on-device. Trying to model transitions as `sportTypeId: 8` segments produces invalid input.
2. **Segment composition rules.** When a multisport segment combines `warmup + repeat + interval` top-level steps, Garmin's server silently splits the segment, reorders steps across segments, and reassigns sports — corrupting the workout. Allowed combinations are `warmup + repeat` (start), `interval + cooldown` (end), and any single `interval`. Anything else triggers re-segmentation.
3. **Target value ordering.** Garmin's server stores pace and power range targets as `(targetValueOne, targetValueTwo) = (faster, slower)` for pace.zone and `(higher_W, lower_W)` for power.zone. Sending the opposite order causes the server to silently reverse the values on some segments but not others, leading to inconsistent display.

The current state of the repo:

- `packages/garmin/src/adapters/schemas/common/sport-type.schema.ts` already declares `MULTI_SPORT: 10` and the `multi_sport` enum value.
- `packages/garmin/src/adapters/schemas/output/workout.schema.ts` already declares `isSessionTransitionEnabled: z.boolean().nullable()`.
- `packages/garmin/src/adapters/schemas/input/workout-input.schema.ts` does **not** include `isSessionTransitionEnabled` — meaning kaiord cannot propagate the flag when writing GCN.
- `.claude/skills/generate-gcn/reference.md` has cycling/running/swimming examples but **no multisport example**, and no mention of the composition rules.
- `packages/garmin/docs/INPUT-VS-OUTPUT.md` lists `isSessionTransitionEnabled` as output-only (line 114), which is incorrect.
- `test-fixtures/gcn/WorkoutMultisportTriathlonInput.gcn` exists but does **not** include `isSessionTransitionEnabled`, and only covers a 3-segment swim/bike/run pattern (not the alternating brick pattern that triggers the composition bug).

This change is limited to the **`@kaiord/garmin` adapter** and supporting documentation/skills. The KRD canonical format is not extended in this proposal — multisport in KRD is a separate, larger conversation.

## Goals / Non-Goals

**Goals:**

- Add `isSessionTransitionEnabled` as an optional boolean field on the Garmin workout INPUT schema, so the kaiord pipeline can propagate it through round-trip.
- Capture the empirical multisport rules (composition, target ordering, transition mechanics, global stepOrder) in a single authoritative document under `packages/garmin/docs/`.
- Update the `generate-gcn` skill so the next time anyone runs `/generate-gcn` for a brick / triathlon / duathlon, the output respects Garmin's composition rules without empirical re-discovery.
- Add adapter-contract requirements that lock in the round-trip behavior, so future regressions are caught by spec validation.
- Ship a fixture for the alternating brick pattern so round-trip tests exercise the corrected behavior.

**Non-Goals:**

- Extending the KRD domain to natively model multisport. KRD currently models a single sport per workout. Mapping a multisport GCN to a single KRD requires a domain-level decision (likely a "session" wrapper) that warrants its own proposal.
- Auto-detecting whether a workout is "multisport" at the application layer. The flag is propagated as-is from the input.
- Implementing the explicit `transition` sport type — it is not part of Garmin's data model and we will not invent one.
- Changes to the Garmin Connect HTTP client (`@kaiord/garmin-connect`). The client already POSTs whatever JSON the writer produces; no transport changes are needed.

## Decisions

### Decision 1: Add `isSessionTransitionEnabled` as `z.boolean().optional()` on the input schema (not nullable)

**What:** Extend `garminWorkoutInputSchema` with `isSessionTransitionEnabled: z.boolean().optional()`. Output schema already has `.nullable()`; input keeps the simpler optional-only contract.

**Why:** The input schema models what _kaiord_ accepts when constructing a GCN workout. We never need to send `null` explicitly — either the caller wants transitions on (true), off (false), or doesn't care (omitted). Optional-only matches the existing pattern of other input fields like `description`, `poolLength`, etc.

**Layer:** Adapter (infrastructure). The change is in `packages/garmin/src/adapters/schemas/input/`. Domain and application layers are not touched.

**Alternatives considered:**

- `z.boolean().nullable().optional()` to mirror the output schema. Rejected: input doesn't need to express the difference between "absent" and "explicitly null", and the simpler form is consistent with neighbouring fields.
- Auto-defaulting to `true` when `sportType` is `multi_sport`. Rejected: defaulting hides Garmin behavior from the caller and complicates round-trip (we'd need to detect "was it set explicitly or defaulted?"). Better to leave the choice to the caller.

### Decision 2: Document Garmin's composition rules as adapter-level constraints, not validate them at write time

**What:** The rules ("warmup+repeat OK at start, interval+cooldown OK at end, no warmup+repeat+interval mix, etc.") live in `packages/garmin/docs/MULTISPORT-TRANSITIONS.md` and the skill's `reference.md`. The writer does **not** enforce them with validation errors.

**Why:** Garmin's rules are empirical and undocumented by Garmin itself. Hardcoding them as Zod refinements risks drift if Garmin loosens (or tightens) the rules later. Documentation is reversible; schema rejections are not. The skill author and humans constructing GCN by hand are the primary audience for these rules; runtime validation would mostly trip up users without giving them better feedback than Garmin's own UI corruption already does.

**Layer:** Documentation + skill prompt context. No code-layer enforcement.

**Alternatives considered:**

- Add Zod `.refine()` rules that reject `warmup + repeat + interval` segments. Rejected for reasons above.
- Auto-rewrite the segments in the writer to comply (split bad segments). Rejected: this hides bugs and produces output that's hard to diff against the user's intent.

### Decision 3: Modify the `adapter-contracts` spec rather than create a new capability

**What:** Add new requirements under the existing `adapter-contracts` capability for: (a) `isSessionTransitionEnabled` round-trip preservation, (b) multisport segment composition awareness, (c) target value ordering for pace and power.

**Why:** `adapter-contracts` already governs what Garmin/FIT/TCX/ZWO adapters must guarantee on round-trip. Multisport is an extension of those contracts, not a new capability. Creating a separate `multisport-transitions` capability would fragment the contract surface for `@kaiord/garmin`.

**Layer:** Spec only. The capability boundary is unchanged.

**Alternatives considered:**

- Create a new `garmin-multisport` capability. Rejected: too narrow; adapter-contracts is the natural home.
- Modify `krd-format`. Rejected: KRD is not changing here.

### Decision 4: Update fixtures atomically with the schema change in one PR, but split docs/skill updates into a second PR

**What:** First PR: schema + writer/reader changes + fixture updates + adapter-contracts spec delta. Second PR: skill updates (`generate-gcn`) and `packages/garmin/docs/MULTISPORT-TRANSITIONS.md`.

**Why:** The first PR has tight coupling (schema → writer → fixture → tests) and must land as a unit. The second PR is purely additive documentation/skill content; landing it after the first lets the docs reference the merged code without forward-references. Both PRs are independently reviewable.

**Layer:** Process. Affects PR sequencing, not architecture.

### Decision 5: Skill updates use a dedicated `multisport.md` reference file rather than expanding `reference.md`

**What:** Add `.claude/skills/generate-gcn/multisport.md` with the composition rules, the alternating-brick example, and the empirical findings. Cross-link from `SKILL.md` and `reference.md`.

**Why:** `reference.md` is already 347 lines. Multisport adds enough rules and examples that inlining them would push it over a comfortable read length and bury single-sport users under irrelevant content. A dedicated file makes the skill's mental model clearer: "if you're generating multisport, read `multisport.md` first."

**Layer:** Skill content. No code impact.

## Risks / Trade-offs

- **[Risk]** Garmin may change its server-side composition rules. → **Mitigation**: the adapter-contracts spec describes the _behavior_ (round-trip preservation), not the rules themselves. Rules live in mutable docs. If Garmin changes them, we update the docs; the spec stays valid.
- **[Risk]** The new fixture (alternating-brick) might be flaky if Garmin's server normalizes it differently across requests. → **Mitigation**: the fixture is a static INPUT file checked into the repo; round-trip tests parse and re-serialize it locally without touching Garmin. Server-side variance is out of scope for round-trip tests.
- **[Risk]** Adding the optional flag without a corresponding KRD field means the kaiord round-trip `KRD → GCN → KRD` loses the transition info. → **Mitigation**: documented as a known limitation under adapter-contracts. KRD multisport modelling is the follow-up that closes this loop.
- **[Trade-off]** Documenting empirical rules as prose risks staleness if Garmin's behavior shifts. → **Acceptance**: prose with an "as of YYYY-MM-DD" footer is more honest than schema enforcement that pretends to be authoritative when it isn't.
- **[Trade-off]** Splitting docs + skill into a second PR delays full availability. → **Acceptance**: the first PR is functionally complete; the docs PR is a follow-up that improves UX but blocks no use case.

## Migration Plan

This change is non-breaking. `isSessionTransitionEnabled` is added as optional; existing inputs that omit it continue to validate. No deprecation needed.

## Open Questions

- Should the writer emit `isSessionTransitionEnabled: false` explicitly for non-multisport workouts, or omit it entirely? → Default to **omit**: cleaner output, matches the optional contract, and Garmin handles absence gracefully for single-sport workouts.
- Does Garmin's server actually respect `isSessionTransitionEnabled: false` on a multisport workout, or does it always force transitions for `multi_sport`? → Out of scope for this change. The proposal is that the adapter accepts and propagates whatever the caller sends; Garmin's server-side semantics for `false` is a separate empirical question that, if relevant, gets its own follow-up.
