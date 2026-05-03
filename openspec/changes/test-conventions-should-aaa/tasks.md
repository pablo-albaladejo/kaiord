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
        and the aaa-allowlist Set (drained for those packages only).
  PR-4: depends on PR-1, NOT on PR-2/PR-3. Touches packages/workout-spa-editor/src/{application,
        adapters,store,hooks,lib}/**/*.test.{ts,tsx} and the aaa-allowlist Set.
  PR-5: depends on PR-1, NOT on PR-2/PR-3/PR-4. Touches packages/workout-spa-editor/src/{components,
        pages}/**/*.test.{ts,tsx} (and remaining root tests) and the aaa-allowlist Set.
  PR-6: depends on PR-2 AND PR-3 AND PR-4 AND PR-5 (all migration PRs landed, both allowlists
        drainable). Touches scripts/check-test-{title-should,aaa}.mjs (delete ALLOWLIST field
        or set to empty), eslint.config.js (flip vitest/valid-title to 'error'), AGENTS.md,
        CLAUDE.md, and openspec/changes/test-conventions-should-aaa/ (archive prep).

Note: PR-3, PR-4, PR-5 may ship in parallel after PR-1 lands — they touch disjoint file sets.
PR-2 may also ship in parallel with PR-3..PR-5 — title and AAA invariants are orthogonal,
the codemod modifies only it() title strings, and AAA migration modifies only comments inside
it() bodies. The opsx-ship convention serializes them only for review-bandwidth reasons.
-->

## 1. PR-1 §1 — Unblock ESLint + install guards with full allowlists (TDD red → green)

- [ ] 1.1 Frequency histogram measurement: run `grep -rE "^\s*it\(['\"]" packages --include="*.test.ts" --include="*.test.tsx" -h | sed -E 's/^[[:space:]]*it\(["'\'']([^"'\'']*).*/\1/' | awk '{print $1}' | sort | uniq -c | sort -rn > /tmp/it-first-words-histogram.txt` against `main` HEAD. Commit the histogram to the PR description (not the codebase) so D3's verb-table can be re-validated at PR-2 ship-time.

- [ ] 1.2 `eslint.config.js` edit: remove `**/*.test.ts`, `**/*.test.tsx`, `**/*.test.js`, `**/*.spec.ts`, `**/tests/**/*.ts` from the global `ignores` block at lines 59-65. Verify the test-files override block at lines 144-169 is now reachable: run `pnpm lint` and confirm zero new errors (test files lint clean against the existing relaxed test rules).

- [ ] 1.3 `pnpm add -Dw @vitest/eslint-plugin` (root devDependency). Pin to a version compatible with ESLint 10.x (target `^1.x` at PR-1 ship-time; verify in npm registry). Update `package.json` and `pnpm-lock.yaml`.

- [ ] 1.4 `eslint.config.js` edit: extend the test-files override block at lines 144-169 with `import vitest from "@vitest/eslint-plugin"`, register `plugins: { vitest }`, and add `'vitest/valid-title': ['warn', { mustMatch: { it: ['^should '] } }]` (D2 staged-activation: ships at `'warn'` severity in PR-1, flipped to `'error'` in PR-6 — `mustMatch` shape unchanged across the flip). The `'warn'` choice closes the IDE/pre-commit/CI parity gap that `'off'` would create (Factor X). Document the staging in a comment immediately above the rule citing D2.

- [ ] 1.5 `scripts/check-test-title-should.test.mjs` lands first with ≥ 8 failing tests (TDD red): (a) literal title `it("should X")` → pass, (b) literal title `it("renders X")` → fail with `<file>:<line>` in stderr, (c) `it.skip("renders X")` → fail (alias coverage), (d) `it.only("renders X")` → fail, (e) `it.todo("renders X")` → fail, (f) `it.each([1,2])("renders %s", v => …)` → fail with placeholder stripping verified, (g) template-literal title `it(\`should X\`)` → pass, (h) template-literal with substitution `it(\`${prefix} X\`)` → fail with explain (cannot statically verify prefix), (i) allowlist hit (path:line in ALLOWLIST) → silently pass, (j) allowlist miss → fail. Test fixtures use temporary directories so the suite does not depend on `packages/**` state.

- [ ] 1.6 `scripts/check-test-title-should.mjs` implements the contract (D6 TS Compiler API). Walks `packages/**/*.test.{ts,tsx}` (excludes `e2e/**` Playwright specs, excludes `node_modules`). For each `it(...)` / `it.skip(...)` / `it.only(...)` / `it.todo(...)` / `it.each(...)(...)` call, extracts arg[0] as `StringLiteral` or `TemplateLiteral`, strips D8 placeholders, verifies prefix is `should `. Exports `ALLOWLIST` Set (1,409 entries from §1.1's measurement, keyed `<repo-relative-path>:<line>`). Architectural mirror of `scripts/check-no-pii-leakage.mjs`: identical entry-point check (`pathToFileURL(process.argv[1]) === import.meta.url`), exported `checkTestTitleShould()` function, violation-collection-then-exit pattern. Co-locates the violations under `findings - allowlist`; exits 1 if non-empty.

- [ ] 1.7 `scripts/check-test-aaa.test.mjs` lands first with ≥ 7 failing tests: (a) file with three markers in order (one blank line between) → pass, (b) missing `// Arrange` → fail, (c) missing `// Act` → fail, (d) missing `// Assert` → fail, (e) markers out of order → fail, (f) no blank line between sections → fail, (g) multiple statements per section → pass, (h) allowlisted file → silently pass, (i) file with zero `it(...)` → silently pass (no test bodies to enforce on), (j) `// arrange` lower-case variant → pass (D7's case-insensitive regex). Same temp-dir fixture pattern.

- [ ] 1.8 `scripts/check-test-aaa.mjs` implements the contract. Walks the same path set. For each `it(...)` body (the second arg's function/arrow body), extracts the body's statement list with their leading line comments. Verifies the comment sequence matches `Arrange` → `Act` → `Assert` (case-insensitive, leading whitespace tolerated, no other comments interspersed at section-start positions). Verifies one blank-line gap between sections (line numbers from TS source-map: section-N's last statement end-line + 2 ≤ section-(N+1)'s first comment line). Exports `ALLOWLIST` Set keyed by repo-relative file path (D4 file-level allowlist) initialized with the 318 known violator files. Same exit-code contract.

- [ ] 1.9 `package.json` wiring: no new top-level script (D10). The two new `scripts/check-test-{title-should,aaa}.test.mjs` files are auto-picked by `pnpm test:scripts` per the existing harness convention. Verify by running `pnpm test:scripts` and confirming 17+ new test cases run (≥ 8 + ≥ 7 = 15, plus harness fixtures).

- [ ] 1.10 Co-localized invariants verification: run `pnpm test:scripts` and `pnpm lint`. Both green. Run `pnpm -r test`: all packages green (no test changed). Run a manual smoke: introduce a new `it("renders X", () => {})` in any test file and confirm `pnpm test:scripts` fails with `<path>:<line>` in stderr.

- [ ] 1.11 PR-1 description states: "PR-1 ships scaffolding with full allowlists. Existing tests pass; new tests authored after merge MUST start with `should ` and MUST contain AAA markers (file-level). The codemod and AAA migrations follow in PR-2..PR-5; this PR is independently revertable."

- [ ] 1.12 Changeset added at `.changeset/test-conventions-infra.md` (chore-class). Commit message: `feat(scripts): test-conventions guards with allowlist scaffolding`. Conventional-commits compliant.

## 2. PR-2 §2 — Codemod for `should` prefix + drain title-allowlist (TDD red → green)

- [ ] 2.1 Verb-frequency re-measurement: re-run the histogram from §1.1 at PR-2 branch base. If the measurement changed by > 5% from PR-1's measurement (e.g., test additions in PR-1's review window), update D3's verb-table to maintain ≥ 95% coverage. Commit the re-measurement to PR-2's description.

- [ ] 2.2 `scripts/codemod-should-prefix.test.mjs` lands first with ≥ 10 failing tests: (a) `it("renders X")` → `it("should render X")`, (b) `it("returns X")` → `it("should return X")`, (c) `it("is X")` → `it("should be X")`, (d) `it("does not X")` → `it("should not X")`, (e) `it("does X")` → `it("should do X")`, (f) `it.each([1,2])("renders %s", v => …)` → title rewritten, body untouched, (g) `it("should X")` → unchanged (idempotent), (h) `it("ZARK X")` (verb-table miss) → emits to REVIEW_QUEUE, file untouched, (i) template-literal `it(\`renders ${name}\`)` → emits to REVIEW_QUEUE (cannot rewrite static prefix safely), (j) double-quote vs single-quote vs backtick preservation: each rewrite preserves the original quote style.

- [ ] 2.3 `scripts/codemod-should-prefix.mjs` implements the contract. Walks `packages/**/*.test.{ts,tsx}`. For each non-`should`-prefixed `it(...)` title, applies D3's three transformation rules (drop-`s` for verb-presents, `is` → `should be`, `does not` → `should not`). Unmapped first words append a line to `REVIEW_QUEUE.md` at repo root: `- [ ] <path>:<line> — <original-title>`. Idempotent: a second run on already-rewritten code is a no-op. Preserves quote style by reading the original character at the title's start position and reusing it. Span-based file rewrite (D6): read file → identify `it(...)` arg[0]'s exact character range → replace only that range → write back.

- [ ] 2.4 Run codemod package-by-package. Order: `core` → `fit` → `tcx` → `zwo` → `garmin` → `garmin-connect` → `ai` → `cli` → `mcp` → `workout-spa-editor` → `landing`. After each package: (i) `pnpm -r test` (the package's tests stay green; titles are metadata), (ii) drain the corresponding entries from `scripts/check-test-title-should.mjs:ALLOWLIST`, (iii) `pnpm test:scripts` green, (iv) commit with message `chore(<pkg>): codemod should-prefix on <pkg> tests`.

- [ ] 2.5 Manual queue drain: process every entry in `REVIEW_QUEUE.md`. For each: open the test file, rewrite the title by hand to a grammatical `should …` form, drain the matching ALLOWLIST entry, re-run `pnpm test:scripts`. Estimated 60–80 entries.

- [ ] 2.6 Final ALLOWLIST drain: `scripts/check-test-title-should.mjs:ALLOWLIST = new Set()` (literal empty). Run `pnpm test:scripts` and `pnpm lint`: green. Run `pnpm -r test`: green. Delete `REVIEW_QUEUE.md` from repo root (it was scaffolding; commits should not carry it).

- [ ] 2.7 PR-2 description includes: (a) the diff stat (1,409 lines changed across N files), (b) confirmation that `ALLOWLIST` is empty, (c) the verb-table coverage measurement post-codemod (target: 100%), (d) sampled random-spot-checks on 5 files showing grammatical title rewrites.

- [ ] 2.8 Changeset added; commit message: `feat(tests): rewrite all it() titles with should-prefix dogma`. Mark as `chore`-class (no published-package version impact — test code only).

## 3. PR-3 §3 — AAA migration on backend packages (subagent-driven)

- [ ] 3.1 Subagent invocation per backend package: launch the `general-purpose` agent (or `test-improver` if the project has it) with the strict prompt in design.md D9. Run sequentially per package (no parallel — keeps reviewable diffs): `core` (16 files) → `fit` (31) → `tcx` (28) → `zwo` (14) → `garmin` (8) → `garmin-connect` (15) → `ai` (7) → `cli` (24) → `mcp` (25) = 168 files total.

- [ ] 3.2 Per-package contract: after the subagent's pass, (i) review the diff (target: every test now has `// Arrange` / `// Act` / `// Assert` markers, blank lines between, no other changes), (ii) `pnpm -r test` green for that package, (iii) drain the package's files from `scripts/check-test-aaa.mjs:ALLOWLIST`, (iv) `pnpm test:scripts` green, (v) commit with message `chore(<pkg>): add AAA markers to <pkg> tests`. If the subagent introduced any test logic edit, revert and re-run with a tightened prompt.

- [ ] 3.3 If a backend package has tests in the D7 escape-hatch category (e.g., `*.integration.test.ts` against external services), keep them in the allowlist with a comment block above the entries documenting the D7 category. The escape-hatch entries are reviewed at this PR's CI run, not at PR-6's lock.

- [ ] 3.4 PR-3 description includes the per-package count of files migrated, the count of escape-hatch entries retained per category, and a sample diff from one package showing the canonical AAA-section form.

- [ ] 3.5 Changeset added; commit message: `feat(tests): AAA structure markers on backend packages`. Conventional-commits compliant.

## 4. PR-4 §4 — AAA migration on SPA non-component layers (subagent-driven)

- [ ] 4.1 Subagent invocation per SPA subdirectory: `application` (41) → `adapters` (24) → `store` (52) → `hooks` (29) → `lib` (11) + remaining roots (`App.test.tsx`, `App.analytics.test.tsx`, `routes.test.tsx`, `router-base.test.tsx`) = ~157 files.

- [ ] 4.2 Same per-subdirectory contract as §3.2: subagent pass → diff review → `pnpm -r test` → allowlist drain → `pnpm test:scripts` → commit. Sequential, no parallel.

- [ ] 4.3 SPA-specific risk: tests under `packages/workout-spa-editor/src/components/**` and `packages/workout-spa-editor/src/hooks/**` may use Testing Library's `render()` + `screen.*` patterns where the boundary between Arrange and Act is subjective. Reviewer judgment call documented per file as needed. If the reviewer disagrees with the subagent's section boundary on a file, revert the file and re-run with an explicit note in the prompt about the canonical placement.

- [ ] 4.4 PR-4 description: per-subdirectory file count migrated; sample diff from a `hooks/` test (the layer with the most subjective Arrange/Act boundary).

- [ ] 4.5 Changeset added; commit message: `feat(tests): AAA structure markers on SPA non-component tests`.

## 5. PR-5 §5 — AAA migration on SPA components + remaining files (subagent-driven)

- [ ] 5.1 Subagent invocation: `components/**` (129 files), then any remaining `*.test.{ts,tsx}` not yet covered by PR-3/PR-4 (sweep `git ls-files "packages/**/*.test.{ts,tsx}" | sort | comm -23 - <(git log --name-only PR-3..HEAD PR-4..HEAD | sort -u)` to identify the residual). Total expected: ~135 files.

- [ ] 5.2 Same per-subdirectory contract as §4.2. Components further split by category for review tractability: `atoms/` → `molecules/` → `organisms/` → `templates/` (atomic-design hierarchy already used in the SPA).

- [ ] 5.3 Per design.md D7, retain in allowlist any component test that drives a Storybook-derived fixture loop (table-driven `it.each` per fixture file). Document the entries in the allowlist with a leading comment block citing D7's category.

- [ ] 5.4 PR-5 description includes the final per-category count of files migrated, the final escape-hatch list (≤ 5 entries expected per design D7), and the diff stat.

- [ ] 5.5 Changeset added; commit message: `feat(tests): AAA structure markers on SPA component tests`.

## 6. PR-6 §6 — Lock empty-allowlist state, flip ESLint rule, write docs

- [ ] 6.1 `scripts/check-test-title-should.mjs`: ALLOWLIST is empty; delete the field entirely from the script (D2 says PR-1 ships with the field; PR-6 removes it once empty). Update the co-located `*.test.mjs` to drop the `allowlist hit` test branch. Re-run `pnpm test:scripts`: green.

- [ ] 6.2 `scripts/check-test-aaa.mjs`: if ALLOWLIST is empty, delete the field. If non-empty (D7 escape-hatch entries), retain the field with a comment block at the head of the file documenting each entry's D7 category.

- [ ] 6.3 `eslint.config.js`: flip the severity of `vitest/valid-title` from `'warn'` to `'error'`. The `mustMatch` shape is unchanged (set in PR-1 §1.4): the diff is one literal — `'warn'` → `'error'`. Run `pnpm lint`: green (every test now has a `should `-prefixed title; the rule fires only on new violations going forward, and now hard-blocks PRs at lint time as well as at the mechanical-guard layer).

- [ ] 6.4 `AGENTS.md` edit: replace the existing `- AAA pattern: Arrange, Act, Assert (blank lines between sections)` line under `## Testing` with a full subsection (worked example, escape-hatch reference, IDE/pre-commit/CI enforcement layers).

- [ ] 6.5 `CLAUDE.md` (root) edit: same subsection text, mirroring AGENTS.md.

- [ ] 6.6 `openspec/changes/test-conventions-should-aaa/proposal.md` updated with `> Completed: 2026-MM-DD` marker (per archive convention). `pnpm lint:specs` green.

- [ ] 6.7 `/opsx-archive`: move `openspec/changes/test-conventions-should-aaa/` → `openspec/changes/archive/2026-MM-DD-test-conventions-should-aaa/`. Promote `specs/test-conventions/spec.md` to `openspec/specs/test-conventions/spec.md` (D11). Run `pnpm archive:index` to refresh `openspec/changes/archive/README.md`. Run `pnpm lint:archive`, `pnpm lint:archive-index`, `pnpm lint:specs`: all green.

- [ ] 6.8 PR-6 description: confirms both ALLOWLIST fields removed (or held only D7 escape-hatch entries, with the entries enumerated), the ESLint rule is now `'error'`, the docs subsection is in place, and `/opsx-archive` has run.

- [ ] 6.9 Changeset added; commit message: `feat(tests): lock test-conventions invariants and archive change`.

- [ ] 6.10 Memory update: refresh the `feedback_mechanical_over_ai` memory entry in `/Users/pablo/.claude-personal/projects/-Users-pablo-development-personal-kaiord/memory/` to cite this change as a canonical application of the rule (large-scale convention enforced via two co-located mechanical guards rather than reviewer attention).
