## Context

`AGENTS.md` (last edit `2026-04-12`) and the project root `CLAUDE.md` both document an "AAA pattern" for tests with the wording "Arrange, Act, Assert (blank lines between sections)". Neither documents a `should`-prefix dogma — that surfaces as the dominant naming pattern (71% of `it(...)` titles in `main`) but is unwritten. The gap between documentation and reality is policed by no automation:

- `eslint.config.js:59-65` lists `**/*.test.ts`, `**/*.test.tsx`, `**/*.test.js`, `**/*.spec.ts`, and `**/tests/**/*.ts` in the global `ignores` block. Per ESLint flat-config semantics, a global `ignores` is non-overridable by later config blocks; the test-files block at `eslint.config.js:144-169` is unreachable today and lints zero tests in CI.
- `scripts/` has 30+ co-located mechanical guards (`check-no-pii-leakage.mjs`, `check-no-zustand-writethrough.mjs`, `check-no-library-dual-mount.mjs`, `check-archive-dates.mjs`, `check-archive-followups.mjs`, …) but none audits test-file structure. The pattern is well-established; nothing extends it to `*.test.{ts,tsx}`.
- The `pnpm test:scripts` harness (wired to husky `pre-commit` and the CI lint job) is the natural CI mount-point for new guards. It already runs ≥ 300 node:test cases across the existing scripts.

The user explicitly chose dogma over pluralism on the title rule, and full AAA coverage (no per-`it` exemption) on the body rule, with explicit acceptance of the migration cost. The design ratifies those choices and adds the engineering scaffolding to make them mechanical.

This change is phased across six PRs because the migration scope (1,409 title rewrites + 318 file AAA additions across 520 files) cannot be reviewed atomically. Phase 1 ships infrastructure with full allowlists so CI stays green from minute zero. Phases 2 and 3 drain the allowlists in chunks. Phase 4 locks the empty-allowlist state and promotes the spec.

## Goals / Non-Goals

**Goals:**

- Convert two prose-only conventions into mechanically-enforced invariants on `*.test.{ts,tsx}` files in `packages/**`.
- Pay off the existing 1,409 `it(...)` title violations and 318 file-level AAA violations in chunks reviewable by a single human reader per PR.
- Expose the rules in three locations the developer hits before CI does: IDE (ESLint), pre-commit (husky → `pnpm test:scripts`), and CI (the same guards as part of `pnpm lint`).
- Honor the project's `feedback_mechanical_over_ai` rule: every invariant is enforced by a deterministic guard with a co-located test suite. No conventions live only in `AGENTS.md`.
- Preserve `pnpm -r test` green at every commit boundary, including the migration PRs. Title and comment changes are metadata-only by construction.

**Non-Goals:**

- Enforce conventions on `describe(...)` titles. Describe blocks are noun-phrase agglomerators; a `should`-prefix is grammatically wrong on them. A separate small change can add a noun-phrase guard if drift appears.
- Rewrite tests to be more idiomatic. The migration is comment- and title-level only. Refactoring test logic, splitting bloated `it(...)` blocks, or changing assertion style is explicitly out of scope.
- Audit `e2e/**` Playwright spec files. Their `test(...)` calls follow Playwright conventions, not Vitest; their structure is governed by the Playwright runner, not this change.
- Provide an opt-out for "trivial" tests. The user rejected a length-threshold escape hatch in the explore phase: AAA is required even when a section is empty. Empty sections are explicit (the marker comment is present, the body is empty) — this is a deliberate choice for visual consistency over local terseness.
- Replace the verb-mapping table (D3 below) with an LLM-based codemod. The deterministic table covers ≥ 95% of cases per the measured frequency histogram; the residual 5% goes through a human-reviewed manual queue. An LLM-based rewrite would introduce non-determinism in the diff, which is incompatible with reviewability and `feedback_mechanical_over_ai`.

## Decisions

### D1 — One capability, two invariants

**Decision:** introduce a single `test-conventions` capability that owns both the title-rule and the AAA-rule.

**Rationale:**

- The two rules share an audience (test authors), a mount point (test files in `packages/**`), and an enforcement substrate (`pnpm test:scripts` + ESLint on tests). Splitting them creates two capability files with overlapping ownership and identical authorship/migration patterns.
- Both rules ride the same allowlist-drain protocol (D5). Sharing the capability keeps the protocol documented in one place.
- The two invariants are not orthogonal — a future contributor who reads the capability spec will reasonably expect both rules to live together as "what does the project mean by 'follow our test conventions'."

**Trade-off:** if a future change wants to relax one invariant without the other (e.g., introduce a noun-phrase form for `it.each`), the capability needs an `## ADDED Requirements` delta, not a fresh capability. Acceptable — that path is the standard OpenSpec workflow.

### D2 — Staged ESLint rule activation across PR-1 and PR-2 (warn → error)

**Decision:** PR-1 installs `@vitest/eslint-plugin` and the test-files config block, and ships the `vitest/valid-title` rule at severity `'warn'` (not `'off'`, not `'error'`). The mechanical guard `scripts/check-test-title-should.mjs` is the binding enforcement during PR-1 ↔ PR-2 (it controls CI pass/fail via the allowlist-ratchet). PR-2 (after the codemod fully drains the should-allowlist) flips the ESLint rule severity to `'error'`. The rule's `mustMatch` shape is identical in both PRs — only the severity changes.

**Rationale:**

- ESLint flat-config does not have a per-file allowlist mechanism for `vitest/valid-title`. If the rule is `'error'` at PR-1 ship-time, every one of the 1,409 violations becomes a lint error and `pnpm lint` fails immediately.
- The mechanical guard supports a path-keyed allowlist Set natively (mirroring `scripts/check-no-pii-leakage.mjs:ALLOWLIST`). It can be drained one entry at a time as the codemod runs, keeping CI green at every commit.
- Choosing `'warn'` over `'off'` in PR-1 closes the 12-factor Factor X (Dev/Prod parity) gap that an `'off'` configuration would create: a developer in their IDE would see no signal on a non-conformant title while the pre-commit hook would block their commit, producing a feedback-loop divergence between IDE and pre-commit/CI. With `'warn'`, the IDE marks each violation with a yellow squiggle, the pre-commit hook still blocks the commit (mechanical guard), and the three enforcement layers (IDE / pre-commit / CI) speak with one voice from PR-1 onward. The repo's existing rule `"max-lines-per-function"` precedent shows that `'warn'`-severity rules do not break `pnpm lint` (CI passes on warnings).
- Once the codemod completes (PR-2 ship-time, allowlist empty), flipping the ESLint rule to `'error'` is safe and gives developers hard IDE-time feedback in addition to the pre-commit/CI block.

**Trade-off:** between PR-1 and PR-2 (estimated ≤ 1 working day), an author who opens a test file with non-conformant titles sees `'warn'` squiggles on the existing 1,409 violations within the file. Acceptable: a developer touching one test file sees only the in-file violations (typically ≤ 20), not the global 1,409. The dev-prod-parity gain outweighs the local visual noise during the migration window.

### D3 — Verb-mapping table is hand-curated, not LLM-derived

**Decision:** the codemod's verb table is a hard-coded JavaScript object literal in `scripts/codemod-should-prefix.mjs`. Each entry is reviewed by hand against the frequency histogram measured at PR-1 ship-time. The table targets ≥ 95% coverage; the residual goes to `REVIEW_QUEUE.md` for one-shot manual review.

**Rationale:**

- The table doubles as the public contract of the codemod — a reviewer can read 24 lines and predict every transformation. An LLM transformation hides the contract behind opaque rewriting and introduces non-deterministic diffs across runs.
- The mapping is small and stable. The 24 most-frequent first words cover ≥ 95% of titles per the measurement; the long tail (e.g., `delete`, `permits`, `upsertMany`, `upsertMany`) is small enough for human review without table maintenance overhead.
- Three transformation patterns are sufficient for the entire table:
  1. **Drop-letter rule** for `s` → bare verb (`renders X` → `should render X`, `returns X` → `should return X`, `does X` → `should do X`).
  2. **Be-substitution rule** for `is X` → `should be X`.
  3. **Negation-elision rule** for `does not X` → `should not X` (avoids the redundant `should do not X`).

  Each rule is a regex-replace. The 24 entries enumerate which first-words match which rule.

**Trade-off:** the table grows if new test-naming conventions appear in the codebase before PR-2 ships. Acceptable: the codemod re-runs on the latest verb histogram at PR-2 ship-time (Phase 2 §2.1 in tasks.md), and any new verbs surfaced post-PR-1 land in the manual queue.

### D4 — AAA is enforced at file level, not at `it` level

**Decision:** `scripts/check-test-aaa.mjs` allowlists by file path, not by `<file>:<line>` of each `it(...)` call. A file is either fully conformant (every `it` has the three markers in order) or fully covered by the allowlist.

**Rationale:**

- AAA conformance is a property of test-file authorship style. Once an author commits to AAA in a file, every `it` in that file follows; once they don't, none do. The empirical pattern in the existing 202 conformant files matches this — none of them is partially conformant.
- Per-`it` allowlists become unbounded debt. A 50-`it` file with 2 exempted `it`s drags the entire migration's complexity up. File-level allowlists are read-once at PR ship-time and either present or absent.
- The escape-hatch table in the spec (D7) holds ≤ 5 entries — small enough to be reviewed at sight in any PR.

**Trade-off:** a file with 49 conformant `it`s and 1 deliberately-non-AAA `it` cannot exist. The deliberately-non-AAA `it` must either (a) be reformatted to AAA with empty sections marked, or (b) move to a sibling file that is itself in the allowlist. Acceptable — option (a) is the standard pattern (empty `// Arrange` is explicit, not silent).

### D5 — Allowlist-drain protocol

**Decision:** every migration PR (PR-2..PR-5) MUST drain a strict subset of the corresponding allowlist. The guards verify the invariant `findings ⊆ allowlist` — any new violation introduced after PR-1 is a hard CI failure, regardless of whether the diff also drains existing entries.

**Rationale:**

- This is the standard "ratchet" pattern (used by `check-no-pii-leakage.mjs` and `check-no-zustand-writethrough.mjs` in the same repo). It guarantees forward progress: the violation count is monotonically non-increasing across PRs.
- A migration PR cannot accidentally regress: if the codemod misses a title or the AAA subagent introduces a new file without markers, the guard catches it on the same PR's CI run.
- The protocol is mechanical — no reviewer needs to track "did this PR drain enough." The guard's diff in the allowlist field is the audit trail.

**Trade-off:** the guard's allowlist is large in PR-1 (1,409 + 318 entries). Acceptable — both Sets are flat string arrays and contribute ≤ 100 KB to the script files. Co-located test fixtures use sub-allowlists, not the production list.

**Note on 12-factor Config (Factor III):** the ALLOWLIST Sets live in the script source rather than environment config. This is a deliberate deviation, not an oversight. The per-PR diff of the allowlist field IS the audit trail of migration progress — a reviewer reads one diff and sees exactly which entries the PR drains. Externalizing the lists (env vars, S3, SSM, a separate `allowlist.json`) would break the ratchet's reviewability property: drift in opaque external state cannot be policed by the same code-review workflow. The same argument applies to the verb-mapping table in `scripts/codemod-should-prefix.mjs` (D3) and the AAA escape-hatch table in the spec (D7) — both are versioned migration state, not runtime config. Treat them as such; do not "fix" them by moving them out of the script source.

### D6 — TypeScript Compiler API, not jscodeshift or ts-morph

**Decision:** both guards (`check-test-title-should.mjs`, `check-test-aaa.mjs`) and the codemod (`codemod-should-prefix.mjs`) use the TypeScript Compiler API directly. No new dependency on `jscodeshift` or `ts-morph`.

**Rationale:**

- The repo's existing AST-walking guards (`check-no-pii-leakage.mjs`, `check-no-zustand-writethrough.mjs`, `check-no-library-dual-mount.mjs`) all use the TS Compiler API directly. Introducing `jscodeshift` or `ts-morph` is a new dependency for one feature.
- The transformations needed are simple: walk for `CallExpression` nodes whose `expression` is `Identifier("it")` (or `PropertyAccessExpression` for `it.skip`/`it.only`/`it.todo`/`it.each`); inspect or rewrite `arguments[0]` if a `StringLiteral`. The full surface fits in ~150 lines per script.
- For the codemod, in-place file rewriting can be done with TS's printer + a span-based string replace (the script reads the file, identifies the `it(...)` title's character range, replaces only that range, and writes the file back). This preserves all whitespace, comments, and quote style — properties that `jscodeshift`'s Recast does not always preserve in mixed-quote codebases.

**Trade-off:** the codemod is slightly more verbose than its `jscodeshift` equivalent (~200 lines vs ~120). Acceptable — the dependency footprint is zero and the script matches the existing `scripts/` patterns reviewers already know.

### D7 — Escape-hatch table for AAA-incompatible files

**Decision:** the AAA guard's allowlist post-migration holds at most files in the following categories:

| Category                                                | Why exempt                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| `*.integration.test.ts` against external network APIs   | Setup is harness-driven (`beforeAll` connects); per-`it` Arrange is empty by harness contract. |
| `*.test.ts` for table-driven `it.each(...)` loops where every row is `[input, expected]` | The Arrange is the table; per-`it` Arrange is empty by data-driven design. |
| Generated fixture loaders (`@kaiord/core/test-utils`)   | Files are generated; reformatting them is overwritten on next regen. |

The table sits in the change-spec under `### Requirement: AAA structure invariant on it bodies` and is migrated to `openspec/specs/test-conventions/spec.md` at archive time. The expected post-migration count is ≤ 5 file paths.

**Rationale:**

- Hard-no allowlist after PR-5 is unrealistic: integration tests with shared fixtures genuinely have empty Arrange sections per their design, and forcing `// Arrange` followed by zero statements adds visual noise without enforcing a real contract.
- The table is small and reviewable. Future additions require an OpenSpec change (the table is requirement-bound, not script-internal config).

**Trade-off:** the spec carries a small operational table. Acceptable — `openspec/SPEC_TEMPLATE.md` already permits Markdown tables in requirement bodies, and the table is bounded by the categories above.

### D8 — `it.each(...)` titles are validated against the `[%s]` template

**Decision:** the title-guard recognizes `it.each(...)("should …", …)` as a callee shape and applies the same `^should ` requirement to its title literal. Template-literal placeholders (`%s`, `%d`, `%i`, `%j`, `%o`, `%#`, `$1`, `$2`, named `$prop`) are stripped before the prefix check, so titles like `should render correctly with %s` pass.

**Rationale:**

- `it.each` is the only test alias in the repo that takes a string argument with substitution placeholders. Without explicit placeholder-stripping, a valid title `should render with %s` would fail the naive `startsWith('should ')` check (it does not, in this case, but other patterns like `${case.name} should …` would).
- The handling is identical to vitest's own internal handling — placeholders are documented in the vitest test-each API.

**Trade-off:** the parser is slightly more complex than the bare `it(...)` case. Acceptable — the handling is contained in one helper function (`stripPlaceholders(title)`) and exercised by a dedicated test branch.

### D9 — Subagent-driven AAA migration, with human review per PR

**Decision:** PR-3 / PR-4 / PR-5 each drive an AI subagent (via the `general-purpose` agent type or a dedicated `test-improver` if available) with the strict prompt in the proposal. The subagent operates in the worktree, makes the edits, runs `pnpm -r test` to verify no regression, and the human reviews the resulting diff before merging.

**Rationale:**

- Mechanical AAA insertion is not viable: the script would need to identify where Arrange stops and Act begins, which requires understanding the test's intent. Only a reader (human or LLM) can make that call.
- The subagent prompt is strict — three comment additions, blank lines between, no other changes. The subagent's contract is narrow enough to be enforced by post-hoc review of the diff.
- `pnpm -r test` after each subagent pass is the safety net. Test logic is unchanged; comment additions cannot break a test. If a test breaks, the subagent edited test logic against the prompt — escalate to human rewrite.
- Per-package commits inside each PR (PR-3 chunks per backend package, PR-4/PR-5 per SPA subdirectory) keep the PR's individual commits reviewable in isolation.

**Trade-off:** the migration is not deterministic across re-runs (a subagent re-run on the same input produces a slightly different diff). Acceptable — the diffs are committed once and reviewed once; deterministic re-runs are not a property the workflow needs after merge.

### D10 — Husky pre-commit and CI both run `pnpm test:scripts`

**Decision:** the two new guards (`scripts/check-test-{title-should,aaa}.mjs`) are wired into `pnpm test:scripts` (no new top-level script). Husky `pre-commit` already invokes `pnpm test:scripts`, and CI's `lint` job already does the same.

**Rationale:**

- Reuse over invention. Adding a new top-level script (`pnpm lint:test-conventions`) duplicates infrastructure: a separate husky entry, a separate CI step, separate documentation. The existing `test:scripts` harness already owns "run all scripts/check-*.mjs co-located node:test suites" — these guards fit the contract exactly.
- The guards' co-located `*.test.mjs` files exercise the guards themselves (do they pass on conformant fixtures? do they fail on non-conformant fixtures?). The harness picks them up automatically; no wiring needed beyond file placement.

**Trade-off:** developers who want to run only the convention checks (not all script tests) need `node --test scripts/check-test-{title-should,aaa}.test.mjs` rather than a named script. Acceptable — the existing scripts share this property.

### D11 — Capability promoted at archive time, not in PR-1

**Decision:** `openspec/specs/test-conventions/spec.md` is created at archive time (after PR-6 lands) by `/opsx-archive`, not at PR-1. During the change's life, the requirement spec lives only at `openspec/changes/test-conventions-should-aaa/specs/test-conventions/spec.md` as a `## ADDED Requirements` delta.

**Rationale:**

- This matches the standard OpenSpec workflow. Capabilities are promoted to `openspec/specs/` only after the change archives and the actual code reflects every requirement. Promoting earlier creates a spec that documents the target state while CI is still green on a subset of it — exactly the doc-vs-code drift the project's `feedback_mechanical_over_ai` rule is set up to prevent.
- The `## ADDED Requirements` delta in the change folder is sufficient context for reviewers during the PRs. `/opsx-verify` can audit the change-folder spec against tasks.md before archival.

**Trade-off:** a future change that wants to extend `test-conventions` cannot do so until this change archives. Acceptable — this change is expected to archive within ≤ 2 weeks of PR-1, and no other in-flight change needs the capability.

## Risks / Trade-offs

- **Codemod misses producing grammatically awkward titles** ("should renders X" if a verb-table miss is allowlisted). Mitigation: the verb-table covers ≥ 95% of cases per measurement, the residual goes to `REVIEW_QUEUE.md` for human review, and PR-2's review checklist explicitly verifies the diff is grammatical at sight on every modified file.
- **AAA migration introduces test logic edits accidentally** in the subagent path. Mitigation: D9's `pnpm -r test` pass + diff review per package commit. The subagent's prompt is narrow enough that a logic edit is detectable on visual diff.
- **Cache invalidation in the migration window**: between PR-1 and PR-6, the project carries two enforcement layers (the guards + ESLint), and the guards' allowlists drift on every PR. Mitigation: D5's ratchet ensures `findings ⊆ allowlist` at every CI run; allowlist drift surfaces immediately as a CI failure.
- **`pnpm test:scripts` runtime grows** with two new guards (each walking ~520 files). Measurement at PR-1 ship-time: target ≤ 8 s for both new guards combined (the existing harness runs in ≤ 30 s). If the budget is exceeded, parallelize via `worker_threads` (D6's TS Compiler API releases parsed source files between visits, so per-file memory pressure is bounded).
- **Onboarding friction**: a new contributor's first test PR may bounce on `vitest/valid-title` IDE-time. Mitigation: PR-6's docs subsection in `AGENTS.md` and `CLAUDE.md` carries a worked example covering the title rule, the AAA rule, and the canonical empty-section form. The `feedback_mechanical_over_ai` memory entry is updated to cite this change.

## Migration Plan

The migration plan is the rest of this proposal — see `tasks.md` for the per-PR task list. Summary:

- **PR-1 (S, ≤ 1 day):** install scaffolding with full allowlists. Zero behavior change in the test suite. Authors of new tests are blocked on a non-`should` title or a missing-AAA file from this PR onward.
- **PR-2 (M, ≤ 2 days):** codemod + manual queue. Drains the title allowlist to empty.
- **PR-3 (L, ≤ 3 days):** AAA on backend packages. Subagent-driven, per-package commits.
- **PR-4 (L, ≤ 3 days):** AAA on SPA non-component layers. Same protocol.
- **PR-5 (L, ≤ 3 days):** AAA on SPA components. Same protocol.
- **PR-6 (S, ≤ 1 day):** lock empty-allowlist state, flip ESLint rule to `'error'`, write docs subsection, archive the change.

Total estimate: ≤ 13 working days (≤ 3 calendar weeks at 1 PR per ≤ 2 days plus review latency).

## Open Questions

None at proposal time. The user has explicitly accepted:

- Dogma `should` over pluralism (decided in explore phase).
- Full AAA coverage with no per-`it` exemption (decided in explore phase).
- The migration cost (decided in explore phase).

Re-open this section if any of D1–D11 needs revisiting after PR-1's frequency histogram measurement reveals an unexpected pattern.
