## Context

`AGENTS.md` (last edit `2026-04-12`) and the project root `CLAUDE.md` both document an "AAA pattern" for tests with the wording "Arrange, Act, Assert (blank lines between sections)". Neither documents a `should`-prefix dogma — that surfaces as the dominant naming pattern (71% of `it(...)` titles in `main`) but is unwritten. The gap between documentation and reality is policed by no automation:

- The global `ignores` block at `eslint.config.js:51-73` lists `**/*.test.ts` (line 59), `**/*.test.tsx` (line 60), `**/*.test.js` (line 61), `**/*.spec.ts` (line 62), and `**/tests/**/*.ts` (line 65). Per ESLint flat-config semantics, a global `ignores` is non-overridable by later config blocks; the test-files block at `eslint.config.js:144-169` is unreachable today and lints zero tests in CI. **A second, independent bug**: even after removing test files from the global ignores, the test-files override block's `files` array is `["**/*.test.ts", "**/*.spec.ts", "**/tests/**/*.ts"]` — `*.test.tsx` is missing. Without extending the array, every `.test.tsx` file would fall through to the SPA `.tsx` block at lines 172–230 (max-lines 80, max-lines-per-function 60, react-hooks rules) and produce a flood of new lint errors. Both edits must happen in the same PR (PR-1).
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
- Choosing `'warn'` over `'off'` in PR-1 closes the 12-factor Factor X (Dev/Prod parity) gap that an `'off'` configuration would create: a developer in their IDE would see no signal on a non-conformant title while the pre-commit hook would block their commit, producing a feedback-loop divergence between IDE and pre-commit/CI. With `'warn'`, the IDE marks each violation with a yellow squiggle, the pre-commit hook still blocks the commit (mechanical guard), and the three enforcement layers (IDE / pre-commit / CI) speak with one voice from PR-1 onward. The repo's existing `no-magic-numbers` rule at `eslint.config.js:158-167` is configured at `'warn'` severity, and CI passes despite warnings — this confirms `'warn'` does not break `pnpm lint` for any existing rule.
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

### D4 — AAA allowlist is sharded by migration-PR target (file-level granularity within shards)

**Decision:** `scripts/check-test-aaa.mjs` exports **three** named allowlist Sets, not one. Each Set covers the file paths drained by exactly one of PR-3 / PR-4 / PR-5. The guard's findings check is `findings ⊆ (AAA_ALLOWLIST_BACKEND ∪ AAA_ALLOWLIST_SPA_NON_COMPONENT ∪ AAA_ALLOWLIST_SPA_COMPONENT)`. Within each shard, allowlist entries are file-paths (not `<file>:<line>` per `it(...)` call).

The sharded layout:

| Shard                                  | Initial size | Drain target | Drained by |
| -------------------------------------- | ------------ | ------------ | ---------- |
| `AAA_ALLOWLIST_BACKEND`                | ~118 entries | empty        | PR-3       |
| `AAA_ALLOWLIST_SPA_NON_COMPONENT`      | ~110 entries | empty        | PR-4       |
| `AAA_ALLOWLIST_SPA_COMPONENT`          | ~90 entries  | empty        | PR-5       |

(Exact counts are determined at PR-1 ship-time after the bootstrap-script run; the sums equal the 318-violator total measured at proposal time.)

**Rationale:**

- **AAA conformance is a property of test-file authorship style.** Once an author commits to AAA in a file, every `it` in that file follows; once they don't, none do. The empirical pattern in the existing 202 conformant files matches this — none is partially conformant. Per-`it` allowlists become unbounded debt; a 50-`it` file with 2 exempted `it`s drags the entire migration's complexity up.
- **Sharding is the parallelization fix.** Without sharding, PR-3 / PR-4 / PR-5 all touch the same `ALLOWLIST` Set literal in the same script file. Three concurrent PRs guarantee merge conflicts on every rebase, which the proposal's "PR-3..PR-5 may ship in parallel" claim cannot honor without sharding. With three named Sets each touching a disjoint region of the same script, parallel PRs rebase cleanly: PR-4 only edits the lines containing `AAA_ALLOWLIST_SPA_NON_COMPONENT`, PR-5 only edits `AAA_ALLOWLIST_SPA_COMPONENT`, PR-3 only edits `AAA_ALLOWLIST_BACKEND`.
- **Rollback co-dependency disappears.** If PR-5 must be reverted after PR-3 has already landed, only `AAA_ALLOWLIST_SPA_COMPONENT` regrows; `AAA_ALLOWLIST_BACKEND` remains empty. Without sharding, a PR-5 revert that re-adds entries collides with PR-3's drain, requiring manual conflict resolution at incident time.
- **The escape-hatch table in the spec (D7)** holds ≤ 5 entries across all three shards combined — small enough to be reviewed at sight in any PR.

**Trade-off:** a file with 49 conformant `it`s and 1 deliberately-non-AAA `it` cannot exist. The deliberately-non-AAA `it` must either (a) be reformatted to AAA with empty sections marked, or (b) move to a sibling file that is itself in the allowlist. Acceptable — option (a) is the standard pattern.

**Rollback runbook (recorded here so it is reviewed once, not figured out at incident time):**

1. **PR-N must be reverted after merge** — call this PR-N's drained shard `S_N`.
2. Run `git revert <commit-of-PR-N>` and resolve any conflicts. The revert reintroduces `S_N`'s drained entries and re-adds the AAA markers' inverse (i.e., removes the markers the migration added).
3. The shard's neighbor PRs — those whose drained shards are NOT `S_N` — have empty allowlists and remain green. The revert touches only the lines of `S_N` in `scripts/check-test-aaa.mjs` and the test files in `S_N`'s scope.
4. Run `pnpm test:scripts` and `pnpm -r test`: green (the revert restored the pre-PR-N state for `S_N`'s files).
5. Re-open PR-N as a fresh PR with the issue addressed. The new PR drains `S_N` again.

The same procedure applies to PR-3 and PR-4. PR-2's revert (codemod for `should` prefix) is independent of the AAA shards entirely — title and AAA invariants are orthogonal — so a PR-2 revert touches only `scripts/check-test-title-should.mjs:ALLOWLIST` and the title strings in test files, never the AAA shards.

### D5 — Allowlist-drain protocol

**Decision:** every migration PR (PR-2..PR-5) MUST drain a strict subset of the corresponding allowlist. The guards verify the invariant `findings ⊆ allowlist` — any new violation introduced after PR-1 is a hard CI failure, regardless of whether the diff also drains existing entries.

**Rationale:**

- This is the standard "ratchet" pattern (used by `check-no-pii-leakage.mjs` and `check-no-zustand-writethrough.mjs` in the same repo). It guarantees forward progress: the violation count is monotonically non-increasing across PRs.
- A migration PR cannot accidentally regress: if the codemod misses a title or the AAA subagent introduces a new file without markers, the guard catches it on the same PR's CI run.
- The protocol is mechanical — no reviewer needs to track "did this PR drain enough." The guard's diff in the allowlist field is the audit trail.

**Trade-off:** the guard's allowlist is large in PR-1 (1,409 + 318 entries). Acceptable — both Sets are flat string arrays and contribute ≤ 100 KB to the script files. Co-located test fixtures use sub-allowlists, not the production list.

**Note on 12-factor Config (Factor III):** the ALLOWLIST Sets live in the script source rather than environment config. This is a deliberate deviation, not an oversight. The per-PR diff of the allowlist field IS the audit trail of migration progress — a reviewer reads one diff and sees exactly which entries the PR drains. Externalizing the lists (env vars, S3, SSM, a separate `allowlist.json`) would break the ratchet's reviewability property: drift in opaque external state cannot be policed by the same code-review workflow. The same argument applies to the verb-mapping table in `scripts/codemod-should-prefix.mjs` (D3) and the AAA escape-hatch table in the spec (D7) — both are versioned migration state, not runtime config. Treat them as such; do not "fix" them by moving them out of the script source.

**Two distinct allowlist patterns coexist in this repo. Do not conflate them.**

| Pattern                       | Initial state                  | Drain target           | Examples in repo                                                                              |
| ----------------------------- | ------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------- |
| **Exception allowlist**       | `new Set([])` (empty)          | Stays empty forever    | `scripts/check-no-pii-leakage.mjs:64`, `scripts/check-no-zustand-writethrough.mjs`            |
| **Migration-state allowlist** | seeded with N entries at PR-1  | drained to empty by PR-N | this change's two new guards; `guidelines-compliance-harden`'s 4 cleanup guards (precedent)   |

The two patterns LOOK identical at the source level (both export `const ALLOWLIST = new Set([...])`) and the existing `scripts/check-allowlists-empty.mjs` guard treats both the same way (regex match for non-empty `new Set([...])`). The semantic difference is operational: an exception allowlist requires a justifying reviewer-gated comment per entry; a migration-state allowlist is bulk-seeded and bulk-drained without per-entry justification. To keep the existing guard happy during the migration window, this change uses the per-guard `OUT_OF_SCOPE` extension in `scripts/check-allowlists-empty.mjs` (see D17 below and PR-1 §1.4b in tasks.md) — adding the two new guards to the targeted exemption Set rather than flipping the global `--mode=warn` flag, which would silently disable the ratchet for every other guard. The header comments of the two new guards SHALL explicitly state which pattern they implement so a future contributor reading either script can tell at sight whether they are looking at exception state or migration state.

### D6 — TypeScript Compiler API, not jscodeshift or ts-morph

**Decision:** both guards (`check-test-title-should.mjs`, `check-test-aaa.mjs`) and the codemod (`codemod-should-prefix.mjs`) use the TypeScript Compiler API directly. No new dependency on `jscodeshift` or `ts-morph`.

**Rationale:**

- The repo's existing AST-walking guards (`check-no-pii-leakage.mjs`, `check-no-zustand-writethrough.mjs`, `check-no-library-dual-mount.mjs`) all use the TS Compiler API directly. Introducing `jscodeshift` or `ts-morph` is a new dependency for one feature.
- The transformations needed are simple: walk for `CallExpression` nodes whose `expression` is `Identifier("it")` (or `PropertyAccessExpression` for `it.skip`/`it.only`/`it.todo`/`it.each`); inspect or rewrite `arguments[0]` if a `StringLiteral`. The full surface fits in ~150 lines per script.
- For the codemod, in-place file rewriting can be done with TS's printer + a span-based string replace (the script reads the file, identifies the `it(...)` title's character range, replaces only that range, and writes the file back). This preserves all whitespace, comments, and quote style — properties that `jscodeshift`'s Recast does not always preserve in mixed-quote codebases.

**Trade-off:** the codemod is slightly more verbose than its `jscodeshift` equivalent (~200 lines vs ~120). Acceptable — the dependency footprint is zero and the script matches the existing `scripts/` patterns reviewers already know.

### D7 — Escape-hatch table for AAA-incompatible files

**Decision:** the AAA guard's allowlist post-migration holds at most files in the categories enumerated in the spec's "AAA structure invariant" requirement (`specs/test-conventions/spec.md`, Requirement: `it(...)` bodies SHALL contain ... markers in order). The table itself lives in the spec — NOT duplicated here — because the table is normative (it bounds what the guard accepts), and duplicating it across spec and design.md creates lockstep-update debt. The expected post-migration count is ≤ 5 file paths total across all three shards.

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

**Lifetime: PR-3 through PR-5 only.** This decision describes how the migration is executed; it is NOT a permanent architectural decision. After PR-6, no AI-assisted code-modification pattern remains in the steady state — the steady-state contract is enforced exclusively by the two mechanical guards (`check-test-title-should.mjs`, `check-test-aaa.mjs`) and the ESLint `vitest/valid-title` rule at `'error'`. A future contributor SHALL NOT copy D9's pattern for an unrelated migration without also recreating an equivalent of D12's mechanical post-condition guard for that migration's window.

**Prerequisite during the migration window:** this decision is acceptable ONLY because **D12 provides the mechanical post-condition guard** (`scripts/check-aaa-migration-no-logic-edits.mjs`) that AST-compares pre/post-migration files and asserts non-comment tokens are unchanged. Without D12, the approach violates `feedback_mechanical_over_ai` ("prefer CI checks / linters / tests / schemas over manual or AI-assisted review for deterministic invariants"). D12's guard ships with PR-1 (per tasks.md §1.13) so it is in place when PR-3/4/5 invoke it; D12 is then deleted at PR-6 (§6.10b) once the migration window closes — D12's existence is bounded to the same lifetime as D9.

**Decision (within the lifetime above):** PR-3 / PR-4 / PR-5 each drive an AI subagent (via the `general-purpose` agent type or a dedicated `test-improver` if available) with the strict prompt in the proposal. The subagent operates in the worktree, makes the edits, runs `pnpm -r test` to verify no regression, and the human reviews the resulting diff before merging.

**Rationale:**

- Mechanical AAA insertion is not viable: the script would need to identify where Arrange stops and Act begins, which requires understanding the test's intent. Only a reader (human or LLM) can make that call.
- The subagent prompt is strict — three comment additions, blank lines between, no other changes. The subagent's contract is narrow enough to be enforced by post-hoc review of the diff.
- `pnpm -r test` after each subagent pass is the safety net. Test logic is unchanged; comment additions cannot break a test. If a test breaks, the subagent edited test logic against the prompt — escalate to human rewrite.
- Per-package commits inside each PR (PR-3 chunks per backend package, PR-4/PR-5 per SPA subdirectory) keep the PR's individual commits reviewable in isolation.

**Trade-off:** the migration is not deterministic across re-runs (a subagent re-run on the same input produces a slightly different diff). Acceptable — the diffs are committed once and reviewed once; deterministic re-runs are not a property the workflow needs after merge.

**Mechanical safety net required to honor the project's `feedback_mechanical_over_ai` rule** — see D12 below. AI-assisted change is acceptable when the verification side is mechanical; without that, this decision drifts away from the rule.

### D12 — Mechanical post-condition guard for the AAA migration (`check-aaa-migration-no-logic-edits.mjs`)

**Decision:** PR-3 / PR-4 / PR-5 (the subagent-driven AAA migrations) SHALL be paired with a CI guard `scripts/check-aaa-migration-no-logic-edits.mjs` that, for every `*.test.{ts,tsx}` file modified in the PR, asserts the AST-level non-comment token sequence is identical to the same file at the PR's merge base. The guard exits non-zero if any token (other than line/block comments and whitespace) was added, removed, or changed.

**Rationale:**

- D9's subagent prompt is "do NOT change test logic" — but that is reviewer-attention-bound, not mechanical. The user's `feedback_mechanical_over_ai` memory is explicit: "prefer CI checks / linters / tests / schemas over manual or AI-assisted review for deterministic invariants." The "AAA migration adds only comments" constraint IS a deterministic invariant. It MUST have a mechanical check.
- The implementation is straightforward with the TS Compiler API: parse base and PR-head sources, walk the SyntaxList of each file, filter out `SyntaxKind.SingleLineCommentTrivia` / `MultiLineCommentTrivia`, and compare the resulting token kind sequences via `Array.equals`. ~80 lines of TS, mirroring `scripts/check-no-pii-leakage.mjs`.
- The guard runs only on the migration PRs (PR-3 / PR-4 / PR-5), invoked from the per-package commit step in §3.2 / §4.2 / §5.2 in tasks.md. Steady-state runs are not needed — the invariant is migration-window-specific.
- This closes the largest hidden-risk vector the iteration-1 expert panel surfaced: a Principal Architect and a Principal Release Engineer independently flagged the missing post-condition as the highest-impact CRITICAL.

**Trade-off:** the guard adds one more CI step to PR-3/4/5 and one more `.mjs` + `.test.mjs` pair under `scripts/`. Acceptable — the cost is bounded (~80+50 lines), the safety gain is outsized, and the script is removed at PR-6 once the migration completes (it has no steady-state purpose).

**Implementation outline:**

```js
// scripts/check-aaa-migration-no-logic-edits.mjs
//
// Migration-window guard for the test-conventions-should-aaa change.
// REMOVED at PR-6 (no steady-state purpose).
//
// CLI: node scripts/check-aaa-migration-no-logic-edits.mjs --base=<git-ref>
//   --base default: process.env.MIGRATION_BASE || 'origin/main'
//   CI invocation: --base=$(git merge-base origin/main HEAD)
//   Local dev:    --base=HEAD~1 (verify last commit only)
//
// For every *.test.{ts,tsx} file changed between <base>..HEAD:
//   1. Read base version (git show <base>:<file>)
//   2. Read PR-head version (working tree)
//   3. Parse both with TypeScript Compiler API (createSourceFile)
//   4. Walk all token nodes; filter out SyntaxKind.SingleLineCommentTrivia,
//      SyntaxKind.MultiLineCommentTrivia, and pure whitespace tokens.
//   5. Compare the resulting (kind, text) tuple sequences for equality.
//   6. If unequal → exit 1 with file path + first divergent token's line.
//
// Co-located scripts/check-aaa-migration-no-logic-edits.test.mjs exercises:
//   (a) base & head identical → pass
//   (b) head adds // Arrange comment → pass (comment-only diff)
//   (c) head changes a string literal → fail
//   (d) head adds an extra expect() call → fail
//   (e) head reorders two statements → fail
//   (f) head changes a number literal (e.g., 100 → 200) → fail
//   (g) base parses but head has syntax error → fail with parse error
//   (h) explicit --base=HEAD~1 path resolves correctly
//   (i) missing --base falls back to MIGRATION_BASE env var, then origin/main
```

The `--base` flag is the explicit dependency: PR-3 / PR-4 / PR-5 CI workflows pass `--base=$(git merge-base origin/main HEAD)` so the comparison is against the merge base, immune to fast-forward merges of unrelated PRs into main during the migration window.

### D10 — Husky pre-commit and CI both run `pnpm test:scripts`

**Decision:** the two new guards (`scripts/check-test-{title-should,aaa}.mjs`) are wired into `pnpm test:scripts` (no new top-level script). Husky `pre-commit` already invokes `pnpm test:scripts`, and CI's `lint` job already does the same.

**Rationale:**

- Reuse over invention. Adding a new top-level script (`pnpm lint:test-conventions`) duplicates infrastructure: a separate husky entry, a separate CI step, separate documentation. The existing `test:scripts` harness already owns "run all scripts/check-*.mjs co-located node:test suites" — these guards fit the contract exactly.
- The guards' co-located `*.test.mjs` files exercise the guards themselves (do they pass on conformant fixtures? do they fail on non-conformant fixtures?). The harness picks them up automatically; no wiring needed beyond file placement.

**Trade-off:** developers who want to run only the convention checks (not all script tests) need `node --test scripts/check-test-{title-should,aaa}.test.mjs` rather than a named script. Acceptable — the existing scripts share this property.

### D11a — Purpose paragraph for the promoted `openspec/specs/test-conventions/spec.md`

**Decision:** the canonical-shape Purpose paragraph (SPEC_TEMPLATE.md rule "one to three sentences") for the promoted spec is fixed at design time so it is reviewed in the proposal phase, not improvised at archive crunch:

> The `test-conventions` capability defines two structural invariants every Vitest test SHALL honor: titles begin with `should ` and bodies are organized into `// Arrange` / `// Act` / `// Assert` sections separated by blank lines. Both invariants are enforced primarily by the mechanical guards in `scripts/check-test-{title-should,aaa}.mjs` and mirrored at IDE-time by the ESLint test-files override block in `eslint.config.js`.

Two sentences, satisfying the template rule. PR-6 §6.7b copies this paragraph verbatim into the promoted spec. The "primarily ... mirrored by ..." phrasing designates the mechanical guards as the single source of truth (any spec amendment touches them first; ESLint config is a derived consequence) — addressing the SRP concern that "owned jointly by three artifacts" raised at iteration 2.

### D11 — Capability promoted at archive time, not in PR-1

**Decision:** `openspec/specs/test-conventions/spec.md` is created at archive time (after PR-6 lands) by `/opsx-archive`, not at PR-1. During the change's life, the requirement spec lives only at `openspec/changes/test-conventions-should-aaa/specs/test-conventions/spec.md` as a `## ADDED Requirements` delta.

**Rationale:**

- This matches the standard OpenSpec workflow. Capabilities are promoted to `openspec/specs/` only after the change archives and the actual code reflects every requirement. Promoting earlier creates a spec that documents the target state while CI is still green on a subset of it — exactly the doc-vs-code drift the project's `feedback_mechanical_over_ai` rule is set up to prevent.
- The `## ADDED Requirements` delta in the change folder is sufficient context for reviewers during the PRs. `/opsx-verify` can audit the change-folder spec against tasks.md before archival.

**Trade-off:** a future change that wants to extend `test-conventions` cannot do so until this change archives. Acceptable — this change is expected to archive within ≤ 2 weeks of PR-1, and no other in-flight change needs the capability.

### D13 — Testing Library AAA boundary heuristic

**Decision:** the canonical Arrange/Act/Assert boundary for tests using `@testing-library/react`'s `render()` + `screen.*` patterns is fixed at design time so the subagent (D9) and the human reviewer share one source of truth across PR-4 / PR-5:

| Test shape                                                                                  | Arrange                          | Act                          | Assert                       |
| ------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------- | ---------------------------- |
| Render-then-interact: `render(<C/>); await userEvent.click(...); expect(screen.find...)`   | `render(<C/>)`                   | `await userEvent.click(...)` | `expect(screen.find...)`     |
| Render-then-assert-paint: `render(<C/>); expect(screen.getBy...).toBeInTheDocument()`       | (empty — the harness IS Arrange) | `render(<C/>)`               | `expect(screen.getBy...)`    |
| Hook-test: `const { result } = renderHook(...); act(() => ...); expect(result.current...)` | `renderHook(...)`                | `act(() => ...)`             | `expect(result.current...)`  |
| Form fill: `render(<Form/>); await userEvent.type(...); await userEvent.click(submit); ...`| `render(<Form/>)`                | both `userEvent` calls       | `expect(...)` for the result |

**Rationale:**

- Without a documented matrix, every reviewer judgment call risks a subagent re-running with inconsistent classifications, producing mixed AAA section boundaries across PR-4's 157 files.
- The four shapes above cover ≥ 90% of Testing Library tests in the SPA per a sampled inspection. Edge cases land in the per-file judgment call, which the reviewer documents inline if non-obvious.
- The matrix lives in design.md (not in `spec.md`) because it is implementation guidance for the migration, not a spec contract. Adding or removing rows is a design-doc-only change, not a capability amendment.

### D14 — Mechanical guards SHALL accept `--changed-files` mode for pre-commit

**Decision:** both `scripts/check-test-title-should.mjs` and `scripts/check-test-aaa.mjs` SHALL accept a `--changed-files` flag. When present, the guard reads `git diff --cached --name-only --diff-filter=ACMR` and parses ONLY the listed `*.test.{ts,tsx}` files (filtering out non-test paths and out-of-scope paths). When absent, the guard walks the full repo tree.

**Rationale:**

- Husky `pre-commit` runs on a developer's working machine on every commit. A 520-file TS Compiler API parse on cold-start is ~10–25 s; this is the kind of latency that turns "pre-commit hook" into "developer disables hook." The existing repo's `pre-commit` (per `scripts/check-husky-no-bypass-hint.mjs`) explicitly tracks bypass culture.
- A 5-file changeset is the realistic median commit size; in `--changed-files` mode the guard runs in well under a second.
- CI (`pnpm lint`) calls the guards in full-tree mode so no violation can sneak through a small diff. The guard's exit-code contract is identical in both modes.

**Trade-off:** the guard has two code paths (full-tree vs changed-files). Acceptable — both share the same per-file AST inspector; only the file enumeration differs. Co-located tests cover both modes.

### D15 — Changeset class is `chore(tests-...)` for every PR in this change

**Decision:** every commit in PR-1 through PR-6 SHALL use a `chore(tests-...)` or `chore(scripts):` conventional-commit prefix, never `feat(...)`. Changesets, when added, SHALL be marked as `chore` class so no public package version is bumped.

**Rationale:**

- This change touches ZERO production code. Every diff is in test files, scripts, ESLint config, OpenSpec docs, and AGENTS.md / CLAUDE.md.
- `feat(tests):` would trigger a minor bump on every public package (`@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/cli`, `@kaiord/mcp`, `@kaiord/ai`) when the next release is cut — bumping versions for changes that have zero consumer-visible impact.
- The conventional `chore` class signals "internal repo change, no public-API delta" — exactly what test-only changes are.

**Trade-off:** a future contributor scanning `git log` for "what features shipped" will not see the test-conventions migration in the feat list. Acceptable — the migration is a process improvement, not a feature.

### D17 — `lint:allowlists-empty` keeps default error mode; per-guard `OUT_OF_SCOPE` extension is the migration hatch

**Decision:** PR-1 SHALL NOT flip the global invocation of `pnpm lint:allowlists-empty` to `--mode=warn`. Instead, PR-1 extends the `OUT_OF_SCOPE` Set inside `scripts/check-allowlists-empty.mjs` (currently containing only `check-no-zustand-writethrough.mjs` per `check-allowlists-empty.mjs:51-56`) to additionally include the two new test-conventions guards: `check-test-title-should.mjs` and `check-test-aaa.mjs`. PR-6 reverts the `OUT_OF_SCOPE` extension when the migration completes.

**Rationale:**

- Per the iteration-2 Principal Release Engineer's IMPORTANT finding: a 4-week `--mode=warn` window for `pnpm lint:allowlists-empty` would silently disable the global "no other allowlist regrows" invariant for every other `scripts/check-*.mjs` guard in the repo. Someone could land an entry in `check-no-pii-leakage.mjs:ALLOWLIST` and the ratchet would not catch it. That is a 4-week soft window across the entire mechanical-guard surface — unacceptable per `feedback_mechanical_over_ai`.
- A targeted per-guard exemption (`OUT_OF_SCOPE` extension) preserves the global invariant for every guard EXCEPT the two new ones. The pattern is precedent — `check-no-zustand-writethrough.mjs` is already in `OUT_OF_SCOPE` for the same migration-state reason (per the existing comment at lines 52-55).
- The PR-1 diff to `scripts/check-allowlists-empty.mjs:OUT_OF_SCOPE` is two lines added to the Set, with a leading comment block citing this design decision. PR-6 removes those two lines.

**Trade-off:** PR-1 touches one additional script (`scripts/check-allowlists-empty.mjs`). Acceptable — the diff is mechanical (two `Set.add`-equivalent literal additions in the source) and the safety gain is global.

**Supersedes the previous PR-1 §1.4b approach (`--mode=warn` flag).** The §1.4b task is rewritten to extend `OUT_OF_SCOPE` instead. See tasks.md §1.4b.

### D16 — Migration window estimate revised to ≤ 4 working weeks

**Decision:** the proposal-level estimate for the full PR-1 → PR-6 cycle is **≤ 4 working weeks (20 working days)**, not the 13 days originally cited.

**Rationale:**

- The iteration-1 expert panel's Principal Release Engineer correctly identified that PR-3's "168 files" of subagent-driven AAA migration is realistically 3+ working days of HUMAN focused review time, not the wall-clock total. Across PR-3 / PR-4 / PR-5 that is 9–12 focused days, plus normal review-cycle latency between PRs, plus the codemod and infra PRs.
- 13 days assumed zero parallelization friction and minimal review pushback. Both are unrealistic for a migration PR touching 168+ files.
- 4 working weeks creates honest buffer for: subagent re-runs when the diff misses the prompt's intent, reviewer pushback on AAA boundary judgment calls per D13, regressions caught by `check-aaa-migration-no-logic-edits.mjs` (D12) requiring re-run, and the manual-queue drain for the codemod's verb-table misses (estimate: 60–80 entries, ~half a day).

**Trade-off:** the estimate is conservative. If the work compresses to 13 days it's gravy; planning for 20 days avoids the failure mode where a "nearly done" migration ships a missed file because the calendar pressure forced a shortcut.

## Risks / Trade-offs

- **Codemod misses producing grammatically awkward titles** ("should renders X" if a verb-table miss is allowlisted). Mitigation: the verb-table covers ≥ 95% of cases per measurement, the residual goes to `REVIEW_QUEUE.md` for human review, and PR-2's review checklist explicitly verifies the diff is grammatical at sight on every modified file.
- **AAA migration introduces test logic edits accidentally** in the subagent path. Mitigation: D9's `pnpm -r test` pass + diff review per package commit. The subagent's prompt is narrow enough that a logic edit is detectable on visual diff.
- **Cache invalidation in the migration window**: between PR-1 and PR-6, the project carries two enforcement layers (the guards + ESLint), and the guards' allowlists drift on every PR. Mitigation: D5's ratchet ensures `findings ⊆ allowlist` at every CI run; allowlist drift surfaces immediately as a CI failure.
- **`pnpm test:scripts` runtime grows** with two new guards (each walking ~520 files). Measurement at PR-1 ship-time: target ≤ 8 s for both new guards combined (the existing harness runs in ≤ 30 s). If the budget is exceeded, parallelize via `worker_threads` (D6's TS Compiler API releases parsed source files between visits, so per-file memory pressure is bounded).
- **Onboarding friction**: a new contributor's first test PR may bounce on `vitest/valid-title` IDE-time. Mitigation: PR-6's docs subsection in `AGENTS.md` and `CLAUDE.md` carries a worked example covering the title rule, the AAA rule, and the canonical empty-section form. The `feedback_mechanical_over_ai` memory entry is updated to cite this change.

## Migration Plan

The migration plan is the rest of this proposal — see `tasks.md` for the per-PR task list. Summary:

- **PR-1 (S, ≤ 2 days):** install scaffolding with full sharded allowlists, two-part `eslint.config.js` fix (global ignores + override block `.tsx` extension), `--mode=warn` flag on `lint:allowlists-empty`. Zero behavior change in the test suite. Authors of new tests are blocked on a non-`should` title or a missing-AAA file from this PR onward.
- **PR-2 (M, ≤ 3 days):** codemod + manual queue. Drains the title allowlist to empty. Includes verb-table re-measurement against PR-1's bootstrap-script histogram.
- **PR-3 (L, ≤ 5 days):** AAA on backend packages (168 files). Subagent-driven, per-package commits, `check-aaa-migration-no-logic-edits.mjs` (D12) post-condition per file.
- **PR-4 (L, ≤ 5 days):** AAA on SPA non-component layers (~157 files). Same protocol; Testing Library AAA boundary matrix (D13) is the source of truth for judgment calls.
- **PR-5 (L, ≤ 5 days):** AAA on SPA components (~135 files). Same protocol; subdivided by atomic-design tier.
- **PR-6 (S, ≤ 1 day):** lock empty-allowlist state, flip ESLint rule to `'error'`, revert `lint:allowlists-empty` to default error mode, delete `check-aaa-migration-no-logic-edits.mjs`, write docs subsection, archive the change.

Total estimate: **≤ 20 working days (4 calendar weeks)** — see D16 for the rationale on the revised estimate vs the originally-cited 13 days.

## Open Questions

None at proposal time. The user has explicitly accepted:

- Dogma `should` over pluralism (decided in explore phase).
- Full AAA coverage with no per-`it` exemption (decided in explore phase).
- The migration cost (decided in explore phase).

Re-open this section if any of D1–D11 needs revisiting after PR-1's frequency histogram measurement reveals an unexpected pattern.
