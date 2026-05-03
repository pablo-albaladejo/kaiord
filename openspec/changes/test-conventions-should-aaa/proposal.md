## Why

The repo's test suite has two well-understood conventions documented in `AGENTS.md` ("AAA pattern: Arrange, Act, Assert (blank lines between sections)") and `CLAUDE.md` ("Follow TDD strictly … AAA pattern"), but neither is enforced anywhere. Today's measurement against `main` (commit `b9ca78ec`):

- **4,887 `it(...)` calls** across **520 `*.test.{ts,tsx}` files**.
- **3,478 (71%) start with `should`**; **1,409 (29%) do not** — they use the alternative "verb-in-third-person" convention (`renders`, `returns`, `is`, `does`, `rejects`, `accepts`, `throws`, `shows`, `emits`, `calls`, `fires`, `maps`, `replaces`, `preserves`, …). Both styles are alive in the codebase. New tests inherit whichever style was used in the file they land next to.
- **318 of 520 test files (61%) lack `// Arrange` / `// Act` / `// Assert` markers** in their `it(...)` bodies. AAA is documented as a contract but is followed in only 39% of files.

The drift is structural, not accidental, and the eslint config has **two** independent bugs:

1. The global `ignores` block at `eslint.config.js:51-73` lists `**/*.test.ts` (line 59), `**/*.test.tsx` (line 60), `**/*.test.js` (line 61), `**/*.spec.ts` (line 62), and `**/tests/**/*.ts` (line 65), so ESLint audits zero test files today. Lines 63–64 (`**/*.stories.{ts,tsx}`) are deliberately ignored and are out of scope for this change.
2. The test-files override block at `eslint.config.js:144-169` already exists but its `files` array is `["**/*.test.ts", "**/*.spec.ts", "**/tests/**/*.ts"]` — **`*.test.tsx` is omitted**. Even if PR-1 only removed test files from the global ignores, `*.test.tsx` would fall through to the SPA `*.tsx` override block at lines 172–230, which enforces `max-lines: 80`, `max-lines-per-function: 60`, and `react-hooks/rules-of-hooks: error` — producing a flood of new lint errors on the 351 `.test.tsx` files in `packages/workout-spa-editor/`. PR-1 must therefore extend the override block's `files` array to `["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/tests/**/*.{ts,tsx}"]` in the same edit that unblocks the global ignores.

The bodies of `it(...)` calls are linted against nothing today. A test author writing `it("renders the button")` against an existing file gets no signal — IDE, pre-commit, and CI all stay silent. Per the project's `feedback_mechanical_over_ai` rule, conventions documented in prose without a guard are not contracts; they are aspirations that decay.

This change converts both conventions into mechanically-enforced invariants and pays off the existing debt in two rounds. After this change, a new `it("renders the button", () => …)` fails CI before it can land.

## What Changes

### Phase 1 (PR-1) — Unblock ESLint + install guards with full allowlists

- `eslint.config.js`: two coordinated edits:
  - **Global ignores (lines 51–73)**: remove `**/*.test.ts`, `**/*.test.tsx`, `**/*.test.js`, `**/*.spec.ts`, `**/tests/**/*.ts`. **Keep** `**/*.stories.ts` and `**/*.stories.tsx` (Storybook stories are out of scope per the "Out of scope" section), `**/test-utils/**` (out of scope; production-test fixture loaders), and `**/test-setup.ts` (Vitest harness).
  - **Test-files override block (lines 144–169)**: extend the `files` array from `["**/*.test.ts", "**/*.spec.ts", "**/tests/**/*.ts"]` to `["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/tests/**/*.{ts,tsx}"]` so `.test.tsx` files match the relaxed test rules instead of falling through to the SPA `.tsx` block at lines 172–230.
- New runtime dep `@vitest/eslint-plugin` (dev). Wire `vitest/valid-title` with `mustMatch: { it: ['^should '], describe: undefined }` into the test-files block. The rule fires in IDE (VS Code ESLint extension) the moment a developer types a non-conforming `it(...)` title.
- New `scripts/check-test-title-should.mjs` + co-located `*.test.mjs` (≥ 8 branches: literal title pass/fail, template-literal title with computed prefix → fail-with-explain, `it.skip`/`it.only`/`it.todo` covered, `it.each(...)` covered, malformed AST guarded, allowlist hit, allowlist miss, multi-file aggregation). Walks `*.test.{ts,tsx}` via the TypeScript Compiler API (same dependency footprint as `scripts/check-no-pii-leakage.mjs`). Maintains an exported `ALLOWLIST` Set initialized with the **1,409 known violators**, keyed by `<repo-relative-path>:<line>` to make drift visible at PR diff time.
- New `scripts/check-test-aaa.mjs` + co-located `*.test.mjs` (≥ 7 branches: file with all three markers in order → pass, missing `// Arrange` → fail, sections out of order → fail, no blank line between sections → fail, multiple statements per section → pass, allowlisted file → pass, file with zero `it(...)` → silently pass). Maintains an exported `ALLOWLIST` Set initialized with the **318 known violator files**, keyed by repo-relative path (file-level, not per-`it`, since AAA is a global trait of the file's testing style).
- `scripts/check-allowlists-empty.mjs`: extend the `OUT_OF_SCOPE` Set (currently `{check-no-zustand-writethrough.mjs}`) to additionally include the two new test-conventions guards per design D17. This per-guard exemption preserves the global "drained allowlist stays empty" ratchet for every OTHER guard during the migration window. Reverted in PR-6.
- `package.json`: husky `pre-commit` already runs `pnpm test:scripts` (the new `*.test.mjs` files for the three migration scripts — `check-test-title-should`, `check-test-aaa`, `check-aaa-migration-no-logic-edits` — get picked up automatically by the existing harness). No new top-level `pnpm` script is introduced (D10 reuse-over-invention).
- CI stays green throughout PR-1: allowlists are sized exactly to current violations, so no test breaks. **New tests authored after PR-1 merges are blocked** — this is the contract the rest of the change drains against.

### Phase 2 (PR-2) — Codemod for `should` + drain `check-test-title-should` allowlist

- New `scripts/codemod-should-prefix.mjs` (TypeScript Compiler API) walks each `*.test.{ts,tsx}` and rewrites the first argument of every `it(...)` call whose title does not start with `should ` AND whose first word matches the verb-mapping table:

  | Title starts with | Rewrites to     |
  | ----------------- | --------------- |
  | `renders X`       | `should render X` |
  | `returns X`       | `should return X` |
  | `is X`            | `should be X`     |
  | `does not X`      | `should not X`    |
  | `does X`          | `should do X`     |
  | `rejects X`       | `should reject X` |
  | `accepts X`       | `should accept X` |
  | `throws X`        | `should throw X`  |
  | `shows X`         | `should show X`   |
  | `hides X`         | `should hide X`   |
  | `fires X`         | `should fire X`   |
  | `emits X`         | `should emit X`   |
  | `calls X`         | `should call X`   |
  | `uses X`          | `should use X`    |
  | `maps X`          | `should map X`    |
  | `replaces X`      | `should replace X` |
  | `preserves X`     | `should preserve X` |
  | `removes X`       | `should remove X` |
  | `passes X`        | `should pass X`   |
  | `updates X`       | `should update X` |
  | `focuses X`       | `should focus X`  |
  | `falls X`         | `should fall X`   |
  | `resolves X`      | `should resolve X` |
  | `includes X`      | `should include X` |

  The 24-row table covers ≥ 95% of the 1,409 violations per the frequency histogram measured at PR-1 ship-time. Unmapped first words → emitted to `REVIEW_QUEUE.md` for one-shot manual review (estimate: 60–80 entries).

- The codemod is run package-by-package (commit-per-package) so the diff is reviewable. After each package: `pnpm -r test` (verifies no test regressed — title is metadata, not behavior) + drain the corresponding entries from `scripts/check-test-title-should.mjs` ALLOWLIST.
- Manual pass on `REVIEW_QUEUE.md`: each entry rewritten by hand, allowlist drained for it.
- PR-2 ships with `ALLOWLIST = new Set()` for `check-test-title-should.mjs`. The "should" half of the dogma is now enforced everywhere — no allowlist remains.

### Phase 3 (PR-3 / PR-4 / PR-5) — AAA migration in three chunks

Pure mechanical transformation is not viable for AAA: a script cannot decide where a test's "Arrange" ends and "Act" begins without reading the test. Each chunk is performed by an AI subagent with a strict prompt, then reviewed:

> **Subagent contract:** For each `it(...)` body in the file, insert exactly three Markdown-style line comments — `// Arrange`, `// Act`, `// Assert` — delimiting the three sections, with one blank line between sections. Multiple statements per section are allowed. Do NOT change test logic. Do NOT delete or rename tests. Do NOT add other comments. If a section is genuinely empty (e.g., no Arrange in a pure assertion), insert the comment but leave the section body empty.

- **PR-3** — Backend packages: `core` (16) + `fit` (31) + `tcx` (28) + `zwo` (14) + `garmin` (8) + `garmin-connect` (15) + `ai` (7) + `cli` (24) + `mcp` (25) = **168 files**. Run `pnpm -r test` after each package; drain allowlist incrementally; commit per package.
- **PR-4** — SPA editor non-component layers: `application` (41) + `adapters` (24) + `store` (52) + `hooks` (29) + `lib` (11) + remaining roots = **~157 files**. Same procedure.
- **PR-5** — SPA editor components: `components/**` (129) + remaining (`pages`, `App.test.tsx`, `routes.test.tsx`, `router-base.test.tsx`, etc.) = **~135 files**.

Each PR ends with the corresponding subset removed from `check-test-aaa.mjs` ALLOWLIST. After PR-5 lands, the AAA allowlist holds exactly the few files (e.g., `*.integration.test.ts` against external services with non-AAA setup harnesses) that the design's escape-hatch table covers.

### Phase 4 (PR-6) — Lock + spec promotion + docs

- `scripts/check-test-title-should.mjs`: ALLOWLIST is empty; delete the field entirely from the script. The check becomes "every `it(...)` title MUST start with `should `, no exceptions."
- `scripts/check-test-aaa.mjs`: ALLOWLIST holds only the documented escape-hatch entries (or is empty). Field is kept iff non-empty; remove iff empty.
- `AGENTS.md`: replace the existing single-line "AAA pattern" mention under `## Testing` with a full subsection ("Test conventions") covering the title rule, the AAA marker rule, the escape-hatch policy, and a worked example.
- `CLAUDE.md` (root) gets the same subsection, mirroring the AGENTS.md text. Memory entry `feedback_mechanical_over_ai` cites this change as a canonical application of the rule.
- `openspec/specs/test-conventions/spec.md` is promoted from `openspec/changes/test-conventions-should-aaa/specs/test-conventions/spec.md` via `/opsx-archive` at the end of the change. The capability is owned by `scripts/check-test-title-should.mjs` + `scripts/check-test-aaa.mjs` + the ESLint `vitest/valid-title` config.

### Out of scope

- `describe(...)` titles. The dogma is `it("should …")`; describes are noun-phrase agglomerators (`describe("Profile validation")`) and a `should`-prefix on them is grammatically wrong. A future small change can add a separate guard for describe-noun-phrase if drift appears.
- `test(...)` calls. The repo currently has zero `test(...)` callers; the guards SHALL also recognize `test(...)` so a future migration to that alias is not silently legal, but no behavioral migration is planned.
- **Storybook stories (`*.stories.{ts,tsx}`).** Storybook's CSF3 `play()` functions contain `expect` / `userEvent` calls and ARE test code, but they follow Storybook conventions (not Vitest's `it(...)` API) and are governed by a future `storybook-conventions` capability — explicitly NOT this change. The eslint global ignores at lines 63–64 (`**/*.stories.{ts,tsx}`) remain untouched in PR-1.
- **`test-utils/` shared fixture loaders.** `**/test-utils/**` (line 72 of `eslint.config.js`) remains in the global ignores. These files are fixture builders consumed by tests, not test cases themselves; they have no `it(...)` calls and do not benefit from the dogma.
- **Playwright e2e tests** at `packages/workout-spa-editor/e2e/**`. These use `test()`, not `it()`, and follow Playwright runner conventions. Out of scope.
- **`*.test.mjs` script tests** under `scripts/**`. They use `node:test`, not Vitest, and have a different API surface (`test(name, fn)` not `it()`). Out of scope.
- Removing the existing 39% of test files that already have AAA markers. They are pre-conformant in concept but the migration WILL normalize variants (`// arrange` → `// Arrange`) per the spec's case-sensitive Pascal-case dogma.
- Per-`it` AAA escape-hatch. AAA is a file-level allowlist by design: a file is either fully conformant or fully covered by the allowlist. The escape-hatch entries are ≤ 5 (per the design's D7 estimation against `*.integration.test.ts` patterns); maintaining a per-`it` exception list would replace one debt vector with another.
- AAA boundary policy for Testing Library `render()` calls. The convention is documented as a worked-example matrix in design.md "Testing Library AAA boundary heuristic", referenced at PR-4 review time so the subagent + reviewer have one consistent source of truth — but the matrix is not part of this capability's spec contract.

## Capabilities

### New Capabilities

- `test-conventions`: scoped to the two file-level invariants on `*.test.{ts,tsx}` files in `packages/**`:
  1. Every `it(...)` (and aliases `it.skip` / `it.only` / `it.todo` / `it.each`) title SHALL start with `should `.
  2. Every `it(...)` body SHALL contain `// Arrange`, `// Act`, `// Assert` line comments in that order, with one blank line between sections.

  Owns the ESLint `vitest/valid-title` config, the two `scripts/check-test-{title-should,aaa}.mjs` guards with their co-located test suites, the allowlist-drain protocol used during the migration, and the documented escape-hatch table for files the AAA invariant cannot cover (e.g., generated fixtures, integration suites with external-service harnesses).

### Modified Capabilities

None. No existing capability owns test-file conventions today; this change creates the capability rather than extending one.

## Impact

- **Affected packages**: every package that contains tests (13 of 15: `core`, `fit`, `tcx`, `zwo`, `garmin`, `garmin-connect`, `ai`, `cli`, `mcp`, `workout-spa-editor`, `landing`, plus the two scripts-only bridges' `vitest.config.js` files which carry no tests today). Test files only — no production-code edits.
- **Affected layers (hexagonal)**: none in production. The change touches `*.test.{ts,tsx}` (test code, not domain/application/adapters/ports) and repo-root tooling (`eslint.config.js`, `package.json`, `scripts/`, `AGENTS.md`, `CLAUDE.md`, `openspec/`).
- **Public API**: no changes. Test titles and comments are not part of any package's published surface.
- **Persistence migration**: none.
- **Dependencies**: one new dev dep — `@vitest/eslint-plugin`. No production deps. No transitive size impact (devDependencies do not ship to consumers).
- **Quality gates**:
  - Zero new ESLint warnings on the production tree (the change unblocks ESLint on tests but every existing test will pass the only new rule, `vitest/valid-title`, as PR-1 ships with the rule disabled until PR-2's codemod completes — see design D2 for the staged-rule-activation plan).
  - Zero new TypeScript errors. Tests are TS-checked under their existing project references; no project-reference shape changes.
  - Coverage thresholds unaffected. Comment additions and title rewrites do not move coverage.
  - `pnpm -r test` SHALL be green at every commit boundary in PR-2 / PR-3 / PR-4 / PR-5. The codemod is metadata-only; AAA additions are comment-only.
  - `pnpm test:scripts` gains 2 new guards with ≥ 15 new branches covered.
- **Risk surface**: low. Codemod risk is bounded — title rewrites cannot affect test logic; the worst regression is a grammatically awkward title (e.g., `should renders X` if a verb-table-miss is allowlisted by accident). AAA migration risk is bounded by the strict subagent prompt ("do NOT change test logic"); the post-PR `pnpm -r test` run catches any accidental edit. Migration-PR ALLOWLIST drift is policed at every PR by the guards themselves: a missed entry in the codemod fails CI on the next push, surfacing the gap immediately.
- **Reversibility**: every PR in this change is independently revertable. PR-1 reverts to the prior eslint+scripts state with no production impact. PR-2 reverts title strings only. PR-3..PR-5 revert comment additions only. PR-6 reverts docs and the empty-allowlist state.
