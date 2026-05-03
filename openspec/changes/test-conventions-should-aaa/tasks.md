<!-- opsx-ship: chunking
PR-1 (infra-with-allowlists):  §1 — Phase 1. Stops the bleeding. Independently revertable.
PR-2 (codemod-should):         §2 — Phase 2. Drains the title allowlist to empty. Depends on PR-1.
PR-3 (aaa-backend):            §3 — Phase 3a. AAA on backend packages. Depends on PR-1.
PR-4 (aaa-spa-layers):         §4 — Phase 3b. AAA on SPA non-component layers. Depends on PR-1.
PR-5 (aaa-spa-components):     §5 — Phase 3c. AAA on SPA components. Depends on PR-1.
PR-6 (lock-and-archive):       §6 — Phase 4. Empties allowlists, flips ESLint to error, writes docs. Depends on PR-2..PR-5.

PR independence — explicit dependency map:
  PR-1: independent. Touches eslint.config.js, package.json (devDep + script wiring),
        scripts/check-test-{title-should,aaa}.{mjs,test.mjs}. No production-code edits.
  PR-2: depends on PR-1. Touches scripts/codemod-should-prefix.mjs (new), every *.test.{ts,tsx}
        with a non-should title (1,409 sites across packages/**), and the should-allowlist
        Set in scripts/check-test-title-should.mjs (drained to empty).
  PR-3: depends on PR-1, NOT on PR-2 (orthogonal — title and AAA are independent invariants).
        Touches *.test.{ts,tsx} in packages/{core,fit,tcx,zwo,garmin,garmin-connect,ai,cli,mcp}/**
        and ONLY the AAA_ALLOWLIST_BACKEND sub-Set (per D4 sharding).
  PR-4: depends on PR-1, NOT on PR-2/PR-3. Touches packages/workout-spa-editor/src/{application,
        adapters,store,hooks,lib}/**/*.test.{ts,tsx} and ONLY the AAA_ALLOWLIST_SPA_NON_COMPONENT
        sub-Set (per D4 sharding).
  PR-5: depends on PR-1, NOT on PR-2/PR-3/PR-4. Touches packages/workout-spa-editor/src/{components,
        pages}/**/*.test.{ts,tsx} (and remaining root tests) and ONLY the AAA_ALLOWLIST_SPA_COMPONENT
        sub-Set.
  PR-6: depends on PR-2 AND PR-3 AND PR-4 AND PR-5 (all migration PRs landed, both allowlists
        drainable). Touches scripts/check-test-{title-should,aaa}.mjs (delete ALLOWLIST field
        or set to empty), eslint.config.js (flip vitest/valid-title to 'error'), AGENTS.md,
        CLAUDE.md, and openspec/changes/test-conventions-should-aaa/ (archive prep).

Note: PR-3, PR-4, PR-5 may ship in parallel after PR-1 lands — they touch disjoint file sets
AND disjoint sub-Sets of the AAA allowlist (per D4 sharding: AAA_ALLOWLIST_BACKEND for PR-3,
AAA_ALLOWLIST_SPA_NON_COMPONENT for PR-4, AAA_ALLOWLIST_SPA_COMPONENT for PR-5). Without
sharding, all three PRs would race to mutate one Set and produce merge conflicts on every
rebase; sharding eliminates that.

PR-2 may also ship in parallel with PR-3..PR-5 — title and AAA invariants are orthogonal,
the codemod modifies only it() title strings (and only the title-allowlist Set), and AAA
migration modifies only comments inside it() bodies (and only the AAA shard for that PR).
The opsx-ship convention serializes them only for review-bandwidth reasons. The rollback
runbook for any single PR (in design.md D4) does not require touching the others' shards.
-->

## 1. PR-1 §1 — Unblock ESLint + install guards with full allowlists (TDD red → green)

- [x] 1.1 Frequency histogram measurement via committed script. Land `scripts/measure-it-titles-histogram.mjs` (TS Compiler API; same architectural pattern as `check-no-pii-leakage.mjs`) + co-located `scripts/measure-it-titles-histogram.test.mjs` (≥ 3 branches: empty repo → empty histogram, single fixture file → expected counts, ignored paths excluded). The script writes the histogram to stdout in `<count> <first-word>` format sorted by descending count. Run it via `pnpm exec node scripts/measure-it-titles-histogram.mjs > /tmp/histogram-pr1.txt` and paste the output into the PR-1 description. PR-2 §2.1 reuses the same script for re-measurement. Reproducibility: any developer rerunning the script produces the same output bit-for-bit (modulo source-tree state).

- [x] 1.1b Bootstrap allowlist seeding script. Land `scripts/bootstrap-test-conventions-allowlists.mjs` (one-shot helper, NOT wired into `pnpm lint`). The script walks `*.test.{ts,tsx}` and emits, on stdout: (a) the title-violator entries `path:line` sorted lexicographically, (b) the AAA-violator file paths grouped by shard (BACKEND / SPA_NON_COMPONENT / SPA_COMPONENT) per the D4 partition rules. Output is pasted INTO the body of `scripts/check-test-title-should.mjs` and `scripts/check-test-aaa.mjs` at PR-1 author time so the hand-edit of the two source files is mechanical. Header comment in the bootstrap script: `// One-shot. Run only at PR-1 ship-time. Migration-state allowlist seed source.`. The script is removed in PR-6 §6.10c (no steady-state purpose).

- [x] 1.2 `eslint.config.js` edit (part 1 of the two-part fix; §1.4 is part 2): remove `**/*.test.ts` (line 59), `**/*.test.tsx` (line 60), `**/*.test.js` (line 61), `**/*.spec.ts` (line 62), and `**/tests/**/*.ts` (line 65) from the global `ignores` block. **KEEP** `**/*.stories.ts` (line 63), `**/*.stories.tsx` (line 64), `**/test-setup.ts` (line 71), and `**/test-utils/**` (line 72) — Storybook stories, the Vitest harness file, and shared test-fixture loaders are explicitly out of scope per the "Out of scope" section in proposal.md. Verify the test-files override block at lines 144-169 is reachable for `.test.ts` after this edit; `.test.tsx` requires §1.4 below before it lints cleanly.

- [x] 1.3 `pnpm add -Dw @vitest/eslint-plugin` (root devDependency). Pin to a version compatible with ESLint 10.x (target `^1.x` at PR-1 ship-time; verify in npm registry). Update `package.json` and `pnpm-lock.yaml`. The audit step has THREE sub-steps to avoid blocking on pre-existing dev-dep CVEs: (1) **before install**, record `pnpm audit --prod` and `pnpm audit` baseline counts (high/critical) in the PR-1 description; (2) install the dep; (3) re-run both audits and fail the PR ONLY IF the high/critical count INCREASED relative to the baseline. Pre-existing CVEs are out of scope. If the upstream peer-dep range is incompatible with the repo's ESLint major, use `pnpm` overrides in `package.json` or fork the plugin (precedent: `tailscale-extension` fork tracked in user's memory `project_fork_tailscale.md`).

- [x] 1.4 `eslint.config.js` edit (part 2 of the two-part fix; §1.2 is part 1): the test-files override block at lines 144-169 needs **two** edits in the same diff:
  1. **Extend `files` array** from `["**/*.test.ts", "**/*.spec.ts", "**/tests/**/*.ts"]` to `["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/tests/**/*.{ts,tsx}"]`. Without this, `.test.tsx` files fall through to the SPA `.tsx` block (max-lines 80, max-lines-per-function 60, react-hooks rules) and produce a flood of new lint errors. This is the diagnosis bug discovered at proposal time.
  2. **Add the vitest plugin and rule**: `import vitest from "@vitest/eslint-plugin"` at the top of the config, register `plugins: { vitest }` in the override block, and add `'vitest/valid-title': ['warn', { mustMatch: { it: ['^should '] } }]` (D2 staged-activation: ships at `'warn'` severity in PR-1, flipped to `'error'` in PR-6 — `mustMatch` shape unchanged across the flip). The `'warn'` choice closes the IDE/pre-commit/CI parity gap that `'off'` would create (Factor X). Document the staging in a comment immediately above the rule citing D2.

  After both parts of the edit, run `pnpm lint`: zero new errors expected (test files lint clean against relaxed rules; `vitest/valid-title` is `'warn'`, not `'error'`).

- [x] 1.4b `scripts/check-allowlists-empty.mjs` edit (per design D17 — supersedes the earlier `--mode=warn` approach): extend the `OUT_OF_SCOPE` Set at lines 51-56 to additionally include `check-test-title-should.mjs` and `check-test-aaa.mjs`. Leading comment block above each new entry SHALL state `// Migration-state allowlist (test-conventions-should-aaa). Drained to empty by PR-6; OUT_OF_SCOPE entry removed by PR-6 §6.3b. See design D17.`. The `pnpm lint:allowlists-empty` invocation in the umbrella `lint` script chain stays at default error-mode — every OTHER guard's allowlist remains policed during the migration window. Without this targeted exemption, either the new guards' seeded allowlists trip the global ratchet on PR-1, OR a `--mode=warn` workaround silently disables the ratchet across all guards for 4 weeks. The targeted approach preserves the global invariant.

- [x] 1.5 `scripts/check-test-title-should.test.mjs` lands first with ≥ 8 failing tests (TDD red): (a) literal title `it("should X")` → pass, (b) literal title `it("renders X")` → fail with `<file>:<line>` in stderr, (c) `it.skip("renders X")` → fail (alias coverage), (d) `it.only("renders X")` → fail, (e) `it.todo("renders X")` → fail, (f) `it.each([1,2])("renders %s", v => …)` → fail with placeholder stripping verified, (g) template-literal title `it(\`should X\`)` → pass, (h) template-literal with substitution `it(\`${prefix} X\`)` → fail with explain (cannot statically verify prefix), (i) allowlist hit (path:line in ALLOWLIST) → silently pass, (j) allowlist miss → fail. Test fixtures use temporary directories so the suite does not depend on `packages/**` state.

- [x] 1.6 `scripts/check-test-title-should.mjs` implements the contract (D6 TS Compiler API). Walks `*.test.{ts,tsx}` matching the spec's scope rules — `packages/**` minus the documented exclusion list (e2e, stories, test-utils, test-setup, node_modules, dist, coverage). Detects `it`-rooted calls via AST shape, NOT enumeration: any `CallExpression` whose callee is `Identifier("it")` or any `PropertyAccessExpression` rooted at `Identifier("it")`. For each, extracts arg[0] as `StringLiteral` or `TemplateLiteral`, strips D8 placeholders, verifies prefix is `should ` (case-sensitive). Exports `ALLOWLIST` Set (entries from §1.1b's bootstrap output, keyed `<repo-relative-path>:<line>`). Architectural mirror of `scripts/check-no-pii-leakage.mjs`: identical entry-point check (`pathToFileURL(process.argv[1]) === import.meta.url`), exported `checkTestTitleShould()` function, violation-collection-then-exit pattern. Header comment SHALL state `// Migration-state allowlist (drained to empty by PR-6). See design.md D5 "Two distinct allowlist patterns" for the distinction from the exception-allowlist pattern in check-no-pii-leakage.mjs.`. Implements `--changed-files` flag per D14 for pre-commit (reads `git diff --cached --name-only --diff-filter=ACMR`). Stderr error format (matching the spec exactly):
  - For verb-table-mapped titles: `R-ItTitleShould: <path>:<line> — title "<title>" must start with "should ". Suggested rewrite: "<rewrite>".`
  - For un-mapped titles: `R-ItTitleShould: <path>:<line> — title "<title>" must start with "should ". Suggested rewrite: (manual rewrite required — see openspec/specs/test-conventions/spec.md).`
  Exits 1 if `findings - allowlist` is non-empty.

- [x] 1.7 `scripts/check-test-aaa.test.mjs` lands first with ≥ 11 failing tests covering branches (a)–(k): (a) file with the canonical Pascal-case markers `// Arrange` / `// Act` / `// Assert` in order with one blank line between → pass, (b) missing `// Arrange` → fail, (c) missing `// Act` → fail, (d) missing `// Assert` → fail, (e) markers out of order → fail, (f) no blank line between sections → fail, (g) multiple statements per section → pass, (h) allowlisted file (any of the three sharded Sets) → silently pass, (i) file with zero `it(...)` → silently pass (no test bodies to enforce on), (j) `// arrange` lower-case variant → **fail** (per spec: case-sensitive Pascal-case dogma, consistent with the title rule's case-sensitive `^should ` lowercase), (k) `it.fails("should X", () => {...})` body with conformant AAA markers → pass; same shape with missing markers → fail (AST-shape detection per spec covers all `it`-rooted aliases). Same temp-dir fixture pattern.

- [x] 1.8 `scripts/check-test-aaa.mjs` implements the contract. Walks the same path set as the title-guard. For each `it`-rooted call body (the second arg's function/arrow body), extracts the body's statement list with their leading line comments. Verifies the comment sequence matches the canonical Pascal-case markers `// Arrange` → `// Act` → `// Assert` (exact case, regex `^\s*//\s+(Arrange|Act|Assert)\s*$`). Leading whitespace tolerated, no other comments interspersed at section-start positions. Verifies one blank-line gap between sections (line numbers from TS source-map: section-N's last statement end-line + 2 ≤ section-(N+1)'s first comment line). Exports **three** named Sets per D4 sharding: `AAA_ALLOWLIST_BACKEND` (drained by PR-3), `AAA_ALLOWLIST_SPA_NON_COMPONENT` (drained by PR-4), `AAA_ALLOWLIST_SPA_COMPONENT` (drained by PR-5). The findings-check is `findings ⊆ (BACKEND ∪ SPA_NON_COMPONENT ∪ SPA_COMPONENT)`. Initial entries are seeded by §1.1b's bootstrap script; exact partition is determined at PR-1 ship-time by file-path glob match against the per-shard scope tables. Header comment SHALL state the same migration-state-allowlist disclaimer as the title-guard (per D5 distinction). Implements `--changed-files` flag per D14 for pre-commit. Stderr error format: `R-ItBodyAAA: <path> — file is missing AAA markers (or markers out of order); see openspec/specs/test-conventions/spec.md for the canonical form.`. Same exit-code contract as `check-test-title-should.mjs`.

- [x] 1.9 `package.json` wiring: no new top-level script (D10). The two new `scripts/check-test-{title-should,aaa}.test.mjs` files are auto-picked by `pnpm test:scripts` per the existing harness convention. Verify by running `pnpm test:scripts` and confirming 17+ new test cases run (≥ 8 + ≥ 7 = 15, plus harness fixtures).

- [x] 1.10 Co-localized invariants verification + empirical smoke checks. Run `pnpm test:scripts` and `pnpm lint`. Both green. Run `pnpm -r test`: all packages green (no test changed). Then perform three additional empirical smoke checks and record the results in the PR-1 description:
  1. **Manual title-violation smoke:** introduce `it("renders X", () => {})` in any test file; confirm `pnpm test:scripts` fails with `R-ItTitleShould: <path>:<line>` in stderr; revert the introduction.
  2. **IDE-feedback smoke:** open a `*.test.tsx` file in VS Code (with the ESLint extension enabled) and confirm an `it("renders X")` shows a yellow squiggle on the title literal (D2 `'warn'` severity). If no signal, debug the extension's flat-config support before merging — `vitest/valid-title` SHALL be visible at IDE-time.
  3. **Cold-start timing:** record `time pnpm test:scripts` (cold cache, full-tree mode) and `time node scripts/check-test-title-should.mjs --changed-files` on a 5-file staged set. Both numbers go in the PR description. If the full-tree time exceeds 30 s OR `--changed-files` exceeds 1.5 s on the 5-file set, parallelize via `worker_threads` (per design D14 / Risks) before merge.

- [x] 1.11 PR-1 description states: "PR-1 ships scaffolding with full allowlists. Existing tests pass; new tests authored after merge MUST start with `should ` and MUST contain AAA markers (file-level). The codemod and AAA migrations follow in PR-2..PR-5; this PR is independently revertable."

- [x] 1.12 Changeset added at `.changeset/test-conventions-infra.md` (chore-class — no public package bump per D15; the change touches zero production code). Commit message: `chore(scripts): test-conventions guards with allowlist scaffolding`. Conventional-commits compliant.

- [x] 1.13 `scripts/check-aaa-migration-no-logic-edits.test.mjs` lands first with ≥ 9 failing tests (TDD red): (a) base & head identical → pass, (b) head adds `// Arrange` comment → pass, (c) head changes a string literal → fail with file path + line, (d) head adds an extra `expect()` call → fail, (e) head reorders two statements → fail, (f) head changes a number literal (`100` → `200`) → fail, (g) head has parse error → fail with parse error, (h) explicit `--base=HEAD~1` flag resolves correctly, (i) missing `--base` falls back to `MIGRATION_BASE` env var, then `origin/main`. Then `scripts/check-aaa-migration-no-logic-edits.mjs` implements the contract per D12 — accepts `--base=<git-ref>` (default: `process.env.MIGRATION_BASE || 'origin/main'`). The script lands in PR-1 (not PR-3 as originally drafted) so PR-3/4/5 may ship in any order — each merely INVOKES the script via `node scripts/check-aaa-migration-no-logic-edits.mjs --base=$(git merge-base origin/main HEAD)`. NOT wired into `pnpm lint` (no steady-state purpose; deleted by PR-6 §6.10b). Implementation mirrors `check-no-pii-leakage.mjs` for TS Compiler API patterns.

## 2. PR-2 §2 — Codemod for `should` prefix + drain title-allowlist (TDD red → green)

- [ ] 2.0 Re-bootstrap allowlist seed at PR-2 branch base. Tests authored on `main` between PR-1 ship-time and PR-2 branch-out may have introduced NEW violators not in PR-1's seeded `ALLOWLIST`. Re-run `node scripts/bootstrap-test-conventions-allowlists.mjs` against PR-2's branch base; diff the output against the current `scripts/check-test-title-should.mjs:ALLOWLIST` Set. If new entries appear: append them to the ALLOWLIST in a dedicated commit at the head of PR-2 with message `chore(scripts): rebase test-conventions title allowlist for net-new violators landed during PR-1 review window`. The PR-2 description SHALL note the count of net-new entries appended (typically zero, but the step is mandatory). Without this step, PR-2's CI fails on day 1 against violators introduced by other PRs that landed during PR-1's review.

- [ ] 2.1 Verb-frequency re-measurement: re-run the histogram from §1.1 at PR-2 branch base. If the measurement changed by > 5% from PR-1's measurement (e.g., test additions in PR-1's review window), update D3's verb-table to maintain ≥ 95% coverage. Commit the re-measurement to PR-2's description.

- [ ] 2.2 `scripts/codemod-should-prefix.test.mjs` lands first with ≥ 10 failing tests: (a) `it("renders X")` → `it("should render X")`, (b) `it("returns X")` → `it("should return X")`, (c) `it("is X")` → `it("should be X")`, (d) `it("does not X")` → `it("should not X")`, (e) `it("does X")` → `it("should do X")`, (f) `it.each([1,2])("renders %s", v => …)` → title rewritten, body untouched, (g) `it("should X")` → unchanged (idempotent), (h) `it("ZARK X")` (verb-table miss) → emits to REVIEW_QUEUE, file untouched, (i) template-literal `it(\`renders ${name}\`)` → emits to REVIEW_QUEUE (cannot rewrite static prefix safely), (j) double-quote vs single-quote vs backtick preservation: each rewrite preserves the original quote style.

- [ ] 2.3 `scripts/codemod-should-prefix.mjs` implements the contract. Walks `packages/**/*.test.{ts,tsx}`. For each non-`should`-prefixed `it(...)` title, applies D3's three transformation rules (drop-`s` for verb-presents, `is` → `should be`, `does not` → `should not`). Unmapped first words are written to `REVIEW_QUEUE.md` at repo root, one line per entry: `- [ ] <path>:<line> — <original-title>`. The script SHALL **truncate** `REVIEW_QUEUE.md` at start of run (not append) — re-runs on the same input produce the same file with no duplicates. Test branch §2.2(k) verifies idempotence of the queue file across re-runs. Codemod itself is idempotent on already-rewritten code per §2.2(g). Preserves quote style by reading the original character at the title's start position and reusing it. Span-based file rewrite (D6): read file → identify `it(...)` arg[0]'s exact character range → replace only that range → write back.

- [ ] 2.4 Run codemod package-by-package. Order: `core` → `fit` → `tcx` → `zwo` → `garmin` → `garmin-connect` → `ai` → `cli` → `mcp` → `workout-spa-editor` → `landing`. After each package: (i) `pnpm -r test` (the package's tests stay green; titles are metadata), (ii) drain the corresponding entries from `scripts/check-test-title-should.mjs:ALLOWLIST`, (iii) `pnpm test:scripts` green, (iv) commit with message `chore(<pkg>): codemod should-prefix on <pkg> tests`.

- [ ] 2.5 Manual queue drain: process every entry in `REVIEW_QUEUE.md`. For each: open the test file, rewrite the title by hand to a grammatical `should …` form, drain the matching ALLOWLIST entry, re-run `pnpm test:scripts`. Estimated 60–80 entries.

- [ ] 2.6 Final ALLOWLIST drain: `scripts/check-test-title-should.mjs:ALLOWLIST = new Set()` (literal empty). Run `pnpm test:scripts` and `pnpm lint`: green. Run `pnpm -r test`: green. Delete `REVIEW_QUEUE.md` from repo root (it was scaffolding; commits should not carry it).

- [ ] 2.7 PR-2 description includes: (a) the diff stat (1,409 lines changed across N files), (b) confirmation that `ALLOWLIST` is empty, (c) the verb-table coverage measurement post-codemod (target: 100%), (d) sampled random-spot-checks on 5 files showing grammatical title rewrites.

- [ ] 2.8 Changeset added (`chore`-class per D15); commit message: `chore(tests): rewrite all it() titles with should-prefix dogma`. No public-package version bump.

## 3. PR-3 §3 — AAA migration on backend packages (subagent-driven)

- [ ] 3.0 (No script creation here — moved to PR-1 §1.13 to allow PR-3/4/5 parallel-ship.) Verify `scripts/check-aaa-migration-no-logic-edits.mjs` exists on `origin/main` (landed by PR-1 §1.13). The PR-3 CI workflow invokes it per-package: `node scripts/check-aaa-migration-no-logic-edits.mjs --base=$(git merge-base origin/main HEAD)`.

- [ ] 3.0a Re-bootstrap AAA allowlist shards at PR-3 branch base (mirrors §2.0 for the title-rule). Run `node scripts/bootstrap-test-conventions-allowlists.mjs` and diff against the current `AAA_ALLOWLIST_BACKEND` Set in `scripts/check-test-aaa.mjs`. Append any net-new violators in a dedicated commit at the head of PR-3 with message `chore(scripts): rebase AAA backend allowlist for net-new violators landed during PR-1/PR-2 review window`. Same pattern for PR-4 §4.0 (touches `AAA_ALLOWLIST_SPA_NON_COMPONENT`) and PR-5 §5.0 (touches `AAA_ALLOWLIST_SPA_COMPONENT`). Each PR re-bootstraps ONLY its own shard — disjoint from the others per D4 sharding.

- [ ] 3.1 Subagent invocation per backend package: launch the `general-purpose` agent (or `test-improver` if the project has it) with the strict prompt in design.md D9. Run sequentially per package (no parallel — keeps reviewable diffs): `core` (16 files) → `fit` (31) → `tcx` (28) → `zwo` (14) → `garmin` (8) → `garmin-connect` (15) → `ai` (7) → `cli` (24) → `mcp` (25) = 168 files total.

- [ ] 3.2 Per-package contract: after the subagent's pass, (i) review the diff (target: every test now has `// Arrange` / `// Act` / `// Assert` markers, blank lines between, no other changes), (ii) `pnpm -r test` green for that package, (iii) drain the package's files from `scripts/check-test-aaa.mjs:AAA_ALLOWLIST_BACKEND` (the only shard PR-3 touches per D4 sharding), (iv) run `node scripts/check-aaa-migration-no-logic-edits.mjs` (the mechanical post-condition introduced by D12 — verifies AST non-comment tokens are unchanged from the PR base; if it fails, the subagent edited test logic and the file MUST be reverted), (v) `pnpm test:scripts` green, (vi) commit with message `chore(tests-<pkg>): add AAA markers to <pkg> tests`. If the subagent introduced any test logic edit, revert and re-run with a tightened prompt.

- [ ] 3.3 If a backend package has tests in the D7 escape-hatch category (e.g., `*.integration.test.ts` against external services), keep them in the allowlist with a comment block above the entries documenting the D7 category. The escape-hatch entries are reviewed at this PR's CI run, not at PR-6's lock.

- [ ] 3.4 PR-3 description includes the per-package count of files migrated, the count of escape-hatch entries retained per category, and a sample diff from one package showing the canonical AAA-section form.

- [ ] 3.5 Changeset added (`chore`-class per D15); commit message: `chore(tests): AAA structure markers on backend packages`. Conventional-commits compliant.

## 4. PR-4 §4 — AAA migration on SPA non-component layers (subagent-driven)

- [ ] 4.0 Re-bootstrap AAA allowlist shard at PR-4 branch base — see §3.0a for the protocol; this PR touches `AAA_ALLOWLIST_SPA_NON_COMPONENT` only. Append any net-new violators in a dedicated commit at the head of PR-4 with message `chore(scripts): rebase AAA SPA non-component allowlist for net-new violators landed during PR-1/PR-2/PR-3 review window`.

- [ ] 4.1 Subagent invocation per SPA subdirectory: `application` (41) → `adapters` (24) → `store` (52) → `hooks` (29) → `lib` (11) + remaining roots (`App.test.tsx`, `App.analytics.test.tsx`, `routes.test.tsx`, `router-base.test.tsx`) = ~157 files.

- [ ] 4.2 Same per-subdirectory contract as §3.2 — except this PR drains ONLY `AAA_ALLOWLIST_SPA_NON_COMPONENT` (per D4 sharding); the BACKEND and SPA_COMPONENT shards are untouched here. Subagent pass → diff review → `pnpm -r test` → drain SPA_NON_COMPONENT shard → run `check-aaa-migration-no-logic-edits.mjs` → `pnpm test:scripts` → commit. Commit message: `chore(tests-spa-<sub>): add AAA markers to SPA <sub> tests`. Sequential per-subdirectory, no parallel within the PR.

- [ ] 4.3 SPA-specific risk: tests under `packages/workout-spa-editor/src/components/**` and `packages/workout-spa-editor/src/hooks/**` may use Testing Library's `render()` + `screen.*` patterns where the boundary between Arrange and Act is subjective. Reviewer judgment call documented per file as needed. If the reviewer disagrees with the subagent's section boundary on a file, revert the file and re-run with an explicit note in the prompt about the canonical placement.

- [ ] 4.4 PR-4 description: per-subdirectory file count migrated; sample diff from a `hooks/` test (the layer with the most subjective Arrange/Act boundary).

- [ ] 4.5 Changeset added (`chore`-class per D15); commit message: `chore(tests): AAA structure markers on SPA non-component tests`.

## 5. PR-5 §5 — AAA migration on SPA components + remaining files (subagent-driven)

- [ ] 5.0 Re-bootstrap AAA allowlist shard at PR-5 branch base — see §3.0a for the protocol; this PR touches `AAA_ALLOWLIST_SPA_COMPONENT` only. Append any net-new violators in a dedicated commit at the head of PR-5 with message `chore(scripts): rebase AAA SPA component allowlist for net-new violators landed during PR-1/PR-2/PR-3/PR-4 review window`.

- [ ] 5.1 Subagent invocation: `components/**` (129 files), then any remaining `*.test.{ts,tsx}` not yet covered by PR-3/PR-4 (sweep `git ls-files "packages/**/*.test.{ts,tsx}" | sort | comm -23 - <(git log --name-only PR-3..HEAD PR-4..HEAD | sort -u)` to identify the residual). Total expected: ~135 files.

- [ ] 5.2 Same per-subdirectory contract as §4.2 — except this PR drains ONLY `AAA_ALLOWLIST_SPA_COMPONENT` (per D4 sharding). Components further split by category for review tractability: `atoms/` → `molecules/` → `organisms/` → `templates/` (atomic-design hierarchy already used in the SPA). After each subdirectory: subagent → diff review → `pnpm -r test` → drain SPA_COMPONENT entries for that subdirectory only → `check-aaa-migration-no-logic-edits.mjs` → `pnpm test:scripts` → commit (`chore(tests-spa-components-<atomic-tier>): ...`).

- [ ] 5.3 Per design.md D7, retain in allowlist any component test that drives a Storybook-derived fixture loop (table-driven `it.each` per fixture file). Document the entries in the allowlist with a leading comment block citing D7's category.

- [ ] 5.4 PR-5 description includes the final per-category count of files migrated, the final escape-hatch list (≤ 5 entries expected per design D7), and the diff stat.

- [ ] 5.5 Changeset added (`chore`-class per D15); commit message: `chore(tests): AAA structure markers on SPA component tests`.

## 6. PR-6 §6 — Lock empty-allowlist state, flip ESLint rule, write docs

- [ ] 6.1 `scripts/check-test-title-should.mjs`: ALLOWLIST is empty; delete the field entirely from the script (D2 says PR-1 ships with the field; PR-6 removes it once empty). Update the co-located `*.test.mjs` to drop the `allowlist hit` test branch. Re-run `pnpm test:scripts`: green.

- [ ] 6.2 `scripts/check-test-aaa.mjs`: if ALLOWLIST is empty, delete the field. If non-empty (D7 escape-hatch entries), retain the field with a comment block at the head of the file documenting each entry's D7 category.

- [ ] 6.3 `eslint.config.js`: flip the severity of `vitest/valid-title` from `'warn'` to `'error'`. The `mustMatch` shape is unchanged (set in PR-1 §1.4): the diff is one literal — `'warn'` → `'error'`. Run `pnpm lint`: green (every test now has a `should `-prefixed title; the rule fires only on new violations going forward, and now hard-blocks PRs at lint time as well as at the mechanical-guard layer).

- [ ] 6.3b `scripts/check-allowlists-empty.mjs` edit: remove `check-test-title-should.mjs` and `check-test-aaa.mjs` from the `OUT_OF_SCOPE` Set introduced in PR-1 §1.4b (per D17). After PR-6 the two new guards' allowlists are empty (`new Set()`) — same shape as `check-no-pii-leakage.mjs:64` — so they no longer need the OUT_OF_SCOPE exemption. Run `pnpm lint`: green. This closes the migration-state window and restores the steady-state "every drained allowlist stays empty" invariant uniformly across every guard.

- [ ] 6.4 `AGENTS.md` edit: replace the existing `- AAA pattern: Arrange, Act, Assert (blank lines between sections)` line under `## Testing` with a full subsection (worked example, escape-hatch reference, IDE/pre-commit/CI enforcement layers).

- [ ] 6.5 `CLAUDE.md` (root) edit: same subsection text, mirroring AGENTS.md.

- [ ] 6.6 `openspec/changes/test-conventions-should-aaa/proposal.md` updated with `> Completed: 2026-MM-DD` marker (per archive convention). `pnpm lint:specs` green.

- [ ] 6.7 `/opsx-archive`: move `openspec/changes/test-conventions-should-aaa/` → `openspec/changes/archive/2026-MM-DD-test-conventions-should-aaa/`. Run `pnpm archive:index` to refresh `openspec/changes/archive/README.md`. Run `pnpm lint:archive` and `pnpm lint:archive-index`: green.

- [ ] 6.7b Promote `specs/test-conventions/spec.md` → `openspec/specs/test-conventions/spec.md` per D11. The change-folder spec uses the `## ADDED Requirements` delta header (correct for change folders per `SPEC_TEMPLATE.md` rule 4); the promoted spec MUST conform to the canonical shape (template rules 1–4). Concretely:
  1. Prepend a `> Synced: <ARCHIVE_DATE> (test-conventions-should-aaa)` line as the first non-empty line (template rule 1; `pnpm lint:specs` enforces this via `scripts/check-spec-format.mjs:30-31` regex match). `<ARCHIVE_DATE>` SHALL equal the date used in §6.6's `> Completed:` marker AND the archive folder prefix from §6.7 — these three dates SHALL be identical for traceability. The `(test-conventions-should-aaa)` slug annotation links the spec back to the archived change folder per `SPEC_TEMPLATE.md` rule 1.
  2. Add a single `# Test Conventions` H1 immediately after the synced marker.
  3. Add a `## Purpose` H2 with the paragraph drafted in design.md "Purpose paragraph for the promoted spec" (so the text is reviewed once at design time, not at archive crunch).
  4. Rename the existing `## ADDED Requirements` H2 to `## Requirements` (template rule 2).
  5. Drop the migration-window-only "Migration allowlists SHALL drain monotonically (ratchet)" requirement from the promoted spec — it describes the migration window, not steady state. The same content remains in the archived change folder for historical record. (Per the Spec Analyst's iteration-1 finding: specs describe steady state.)

  Run `pnpm lint:specs` and `pnpm exec openspec validate --specs`: both green. The promoted spec describes the steady-state contract any future test author follows; the archived change describes the migration that established that contract.

- [ ] 6.8 PR-6 description: confirms both ALLOWLIST fields removed (or held only D7 escape-hatch entries, with the entries enumerated), the ESLint rule is now `'error'`, the docs subsection is in place, and `/opsx-archive` has run.

- [ ] 6.9 Changeset added (`chore`-class per D15); commit message: `chore(tests): lock test-conventions invariants and archive change`.

- [ ] 6.10 Memory update: refresh the `feedback_mechanical_over_ai` memory entry in `/Users/pablo/.claude-personal/projects/-Users-pablo-development-personal-kaiord/memory/` to cite this change as a canonical application of the rule (large-scale convention enforced via two co-located mechanical guards rather than reviewer attention; AI-assisted AAA migration paired with mechanical post-condition `check-aaa-migration-no-logic-edits.mjs`).

- [ ] 6.10b Delete `scripts/check-aaa-migration-no-logic-edits.mjs` and its co-located `*.test.mjs`. The guard was migration-window-only (PR-3/4/5 protection); after PR-6 lands the migration is complete and the guard has no steady-state purpose. Remove any CI references to it. Run `pnpm test:scripts` to confirm no test still references the deleted file.

  **Recovery clause:** if any of PR-3 / PR-4 / PR-5 is reverted post-PR-6 (e.g., a regression discovered in production tests requires backing out a migration shard), the deletion of `check-aaa-migration-no-logic-edits.mjs` SHALL be reverted as part of the same recovery PR before the re-do migration PR opens. This preserves the `feedback_mechanical_over_ai` rule's mechanical-post-condition contract for any AAA-marker re-application work. The recovery PR includes both the script restoration AND extension of the relevant `AAA_ALLOWLIST_*` shard back to its pre-revert state; the subsequent re-do PR drains the shard again with the post-condition guard active.

- [ ] 6.10c Delete `scripts/bootstrap-test-conventions-allowlists.mjs` and its co-located `*.test.mjs`. The script was used at PR-1 ship-time (§1.1b) to seed the allowlists AND at PR-2 / PR-3 / PR-4 / PR-5 branch-base time (§2.0, §3.0a, §4.0, §5.0) to re-bootstrap for any net-new violators that landed in main during the prior PR's review window. After PR-6 lands, the allowlists are empty and the steady-state ratchet alone catches new violators on the first PR introducing them — no re-bootstrap purpose remains. Keep `scripts/measure-it-titles-histogram.mjs` (general-purpose measurement tool, useful for future spec amendments).
