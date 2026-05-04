## ADDED Requirements

### Requirement: `it(...)` titles SHALL start with `should ` (dogma)

Every `it`-rooted call in any `*.test.{ts,tsx}` file in scope SHALL pass a string-literal or template-literal first argument whose textual prefix (after stripping vitest substitution placeholders `%s`, `%d`, `%i`, `%j`, `%o`, `%#`, `$1`, `$2`, and named `$prop` references per vitest's `test.each` API) equals `should ` (the literal seven characters `s`, `h`, `o`, `u`, `l`, `d`, space — case-sensitive lowercase).

**Scope (in-scope file pattern):** `*.test.{ts,tsx}` under `packages/**`, EXCLUDING:

| Excluded path                               | Reason                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `packages/**/test-utils/**`                 | Shared fixture loaders; not test cases.                                                               |
| `packages/workout-spa-editor/e2e/**`        | Playwright `test()` (different runner, different conventions).                                        |
| `**/*.stories.{ts,tsx}`                     | Storybook stories; `play()` test functions tracked under a future `storybook-conventions` capability. |
| `**/test-setup.ts`                          | Vitest harness file; no `it(...)` calls.                                                              |
| `node_modules/**`, `dist/**`, `coverage/**` | Build artifacts.                                                                                      |

The future-proof scoping rule SHALL be: "any `*.test.{ts,tsx}` reachable by `git ls-files` minus the explicit exclusion list above". A repo restructure (e.g., adding `apps/`) MUST automatically include those test files without spec amendment.

**`it`-rooted call detection (AST shape, not enumeration):** the guard SHALL match any `CallExpression` whose callee is either (a) the bare `Identifier("it")` or (b) a `PropertyAccessExpression` whose root expression is `Identifier("it")` — regardless of property name. This covers `it(...)`, `it.skip(...)`, `it.only(...)`, `it.todo(...)`, `it.fails(...)`, `it.concurrent(...)`, `it.runIf(...)`, `it.skipIf(...)`, `it.extend(...)`, `it.for(...)`, and any future vitest aliases without spec amendment. For `it.each([...])(...)` (a `CallExpression` whose callee is itself a `CallExpression`), the guard recurses into the outer call's first argument.

Template literals with substitutions (e.g., ``it(`${prefix} renders X`)``) SHALL be rejected with a parse error naming the file and line, because the static prefix cannot be verified. Authors SHALL re-shape such titles to embed `should ` as a literal prefix (e.g., ``it(`should render ${variant}`)``).

`describe(...)` titles SHALL NOT be subject to this requirement. Describe blocks are noun-phrase agglomerators; the dogma applies only to test cases.

The ESLint rule `vitest/valid-title` from `@vitest/eslint-plugin` SHALL be configured with `mustMatch: { it: ['^should '] }` in the test-files block of `eslint.config.js`, providing IDE-time enforcement. The mechanical guard `scripts/check-test-title-should.mjs` SHALL be the source-of-truth enforcement, called by `pnpm test:scripts` (which is invoked by both husky `pre-commit` and the CI lint job). The guard SHALL exit non-zero (`process.exit(1)`) on violation. The stderr SHALL contain, for each violating call, exactly one line in the format:

```
<rule-id>: <repo-relative-path>:<line> — title "<actual title>" must start with "should ". Suggested rewrite: "should <suggested rewrite>".
```

Where `<rule-id>` is `R-ItTitleShould`. The "Suggested rewrite" field is filled in via the same verb-mapping table the codemod uses (per design D3); for unmapped verbs the field reads `Suggested rewrite: (manual rewrite required — see openspec/specs/test-conventions/spec.md)`. The mechanical guard SHALL accept a `--changed-files` flag (per design D14) which restricts inspection to the staged file set (`git diff --cached --name-only --diff-filter=ACMR`), used by the husky `pre-commit` hook to keep the hook's wall-clock budget under 1.5 s on a 5-file changeset.

#### Scenario: Conformant title passes both layers

- **WHEN** a developer writes `it("should render the calendar with no workouts", () => { … })`
- **THEN** the ESLint rule SHALL NOT fire
- **AND** the mechanical guard SHALL exit zero

#### Scenario: Non-conformant title fails the mechanical guard

- **GIVEN** a developer writes `it("renders the calendar", () => { … })` in `packages/workout-spa-editor/src/components/CalendarPage.test.tsx`
- **WHEN** they run `pnpm test:scripts`
- **THEN** the guard SHALL exit non-zero
- **AND** stderr SHALL contain `packages/workout-spa-editor/src/components/CalendarPage.test.tsx:<line>`

#### Scenario: `it.each` placeholder is stripped before the prefix check

- **WHEN** a developer writes `it.each([1,2,3])("should compute should-be-X for %s", v => { … })`
- **THEN** the placeholder `%s` SHALL be stripped before the prefix check
- **AND** the title `should compute should-be-X for ` SHALL pass the `^should ` check

#### Scenario: Capital-S `Should ` title is rejected (case-sensitive lowercase)

- **GIVEN** a developer writes `it("Should render X")` (capital S) or `it("SHOULD render X")` (all caps)
- **WHEN** the guard runs
- **THEN** it SHALL exit non-zero — the prefix rule is case-sensitive lowercase; the only acceptable seven-character prefix is `s`, `h`, `o`, `u`, `l`, `d`, space

#### Scenario: `--changed-files` mode with no staged test files exits zero silently

- **GIVEN** a developer runs `git commit --amend` with no newly-staged `*.test.{ts,tsx}` files
- **WHEN** husky pre-commit runs `node scripts/check-test-title-should.mjs --changed-files`
- **THEN** the guard SHALL exit zero with no output — there is nothing to enforce, and the empty-staged-set case SHALL NOT block the amend nor fall back to full-tree mode (which would produce surprise latency)

#### Scenario: Any `it`-rooted alias is subject to the same rule via AST-shape detection

- **WHEN** a developer writes `it.skip("renders X")`, `it.only("renders X")`, `it.todo("renders X")`, `it.fails("renders X")`, `it.concurrent("renders X")`, or any other future `it.<alias>("...")`
- **THEN** the guard SHALL fail with the same error message format as `it(...)` because the AST callee root is `Identifier("it")` — no spec amendment needed when vitest adds new aliases

#### Scenario: Template literal with substitution is rejected with parse error

- **WHEN** a developer writes ``it(`${prefix} renders X`, () => { … })`` where `prefix` is a runtime variable
- **THEN** the guard SHALL exit non-zero with a parse-error message stating that the static prefix cannot be verified
- **AND** the recommended remediation SHALL be: rewrite as ``it(`should render X with ${variant}`)``

#### Scenario: `--changed-files` mode restricts inspection to staged files

- **GIVEN** a developer stages two files via `git add`: `pkg/foo.test.ts` (conformant) and `pkg/bar.test.ts` (new violation: `it("renders X")`)
- **AND** the un-staged tree contains a third unrelated violation in `pkg/baz.test.ts`
- **WHEN** husky pre-commit runs `node scripts/check-test-title-should.mjs --changed-files`
- **THEN** the guard SHALL inspect ONLY the two staged files (not `baz.test.ts`)
- **AND** SHALL exit non-zero with `pkg/bar.test.ts:<line>` in stderr — the un-staged violation is NOT in the staged set, so it does NOT block this commit (CI's full-tree run will catch it on push, per the existing ratchet)

### Requirement: `it(...)` bodies SHALL contain `// Arrange`, `// Act`, `// Assert` markers in order

Every `it`-rooted call body in any in-scope `*.test.{ts,tsx}` file (same scope and exclusion list as the title-rule requirement above; AAA escape-hatch table additionally below) SHALL contain three line comments in this exact order: `// Arrange` → `// Act` → `// Assert`. The marker text is **case-sensitive Pascal-case** — `// Arrange` (capital A), `// Act` (capital A), `// Assert` (capital A) — to keep one consistent dogma philosophy across both invariants in this capability (the title rule's `^should ` is also case-sensitive lowercase). The regex is `^\s*//\s+(Arrange|Act|Assert)\s*$` (case-sensitive). The codemod / migration subagent SHALL emit the canonical Pascal-case form; pre-existing variants like `// arrange` or `// AAA` from the 39% already-conformant files SHALL be normalized to the canonical form during the migration. Each comment MUST be a standalone line comment occupying its own line; trailing same-line comments SHALL NOT match.

Each section MAY contain zero or more statements. An empty section is permitted (the marker comment is present, the section body is empty); an empty section SHALL be explicit, not implicit.

Sections SHALL be separated by exactly one blank line (TS source-line gap of ≥ 1) between the last statement of section N and the comment line of section N+1. Multiple blank lines are tolerated; zero blank lines are rejected.

The mechanical guard `scripts/check-test-aaa.mjs` SHALL enforce this requirement at file granularity (D4 file-level allowlist). A file is either fully conformant (every `it(...)` body contains the three markers in order) or fully covered by the escape-hatch allowlist. Per-`it` exemptions SHALL NOT be supported.

The escape-hatch allowlist SHALL be initialized empty after this change archives and SHALL grow only through subsequent OpenSpec changes. Permitted categories at this change's archive time:

| Category                                                             | Why exempt                                                                                     |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `*.integration.test.ts` against external network APIs                | Setup is harness-driven (`beforeAll` connects); per-`it` Arrange is empty by harness contract. |
| Table-driven `it.each([...])` where every row is `[input, expected]` | The Arrange is the table; per-`it` Arrange is empty by data-driven design.                     |

Note: `test-utils/**` files are NOT in this escape-hatch table because they are out of scope per the title-rule's exclusion list above (no `it(...)` calls in fixture loaders means nothing for the AAA guard to enforce on).

#### Scenario: Conformant test body passes the guard

- **GIVEN** a test file containing:

  ```ts
  it("should reject mismatched activity ids", async () => {
    // Arrange
    const profile = await createProfile();
    await db.put({ … });

    // Act
    const result = await getByActivityId(profile, "wrong-id");

    // Assert
    expect(result).toBeNull();
  });
  ```

- **WHEN** `pnpm test:scripts` runs `scripts/check-test-aaa.mjs` on it
- **THEN** the guard SHALL exit zero

#### Scenario: Missing marker fails the guard with file-level violation

- **GIVEN** a test file with one `it(...)` whose body lacks `// Arrange`
- **WHEN** the guard runs
- **THEN** it SHALL exit non-zero
- **AND** stderr SHALL contain the repo-relative file path and the missing-marker name

#### Scenario: Markers out of order are rejected

- **GIVEN** a test body with `// Act` before `// Arrange`
- **WHEN** the guard runs
- **THEN** it SHALL exit non-zero with `markers out of order`

#### Scenario: Multiple statements per section are accepted

- **GIVEN** a test body where `// Arrange` is followed by 5 statements before the blank line and `// Act`
- **WHEN** the guard runs
- **THEN** it SHALL exit zero

#### Scenario: Empty section is accepted when explicit

- **GIVEN** a test body where `// Arrange` is followed immediately by a blank line and `// Act` (no Arrange statements)
- **WHEN** the guard runs
- **THEN** it SHALL exit zero — the section is explicitly empty, not silently omitted

#### Scenario: AAA markers required in `it.each(...)(...)` body

- **GIVEN** the test file contains:

  ```ts
  it.each([1, 2])("should compute for %s", (v) => {
    // Arrange
    const input = v;

    // Act
    const result = compute(input);

    // Assert
    expect(result).toBeDefined();
  });
  ```

- **WHEN** the guard runs
- **THEN** it SHALL apply the same AAA markers requirement to the inner arrow body — the `it`-rooted detection rule (any CallExpression rooted at `Identifier("it")`, including `it.each([])()` whose callee is itself a CallExpression) SHALL recurse into the outer call's first argument and inspect its body
- **AND** the guard SHALL exit zero because the canonical Pascal-case line comments are present in the correct order with blank-line separators

#### Scenario: Lowercase marker variant is rejected

- **GIVEN** a test body using `// arrange`, `// act`, `// assert` (all lowercase)
- **WHEN** the guard runs
- **THEN** it SHALL exit non-zero — the canonical Pascal-case `// Arrange` / `// Act` / `// Assert` is the only acceptable shape

#### Scenario: All-caps marker variant is rejected

- **GIVEN** a test body using `// ARRANGE`, `// ACT`, `// ASSERT`
- **WHEN** the guard runs
- **THEN** it SHALL exit non-zero — same case-sensitive Pascal-case rule as above

#### Scenario: Marker with trailing punctuation is rejected

- **GIVEN** a test body using `// Arrange:`, `// Act.`, `// Assert!`
- **WHEN** the guard runs
- **THEN** it SHALL exit non-zero — the regex anchors require the marker token to be the entire trimmed comment body; trailing punctuation is not valid

(The migration normalizes pre-existing non-canonical variants in the 39% already-conformant files.)

#### Scenario: Escape-hatch file passes regardless of body shape

- **GIVEN** a file `packages/garmin-connect/src/index.integration.test.ts` is in the escape-hatch allowlist with category "integration test against external network APIs"
- **WHEN** the guard runs
- **THEN** the file SHALL be skipped silently and not contribute to the violation count

### Requirement: ESLint SHALL NOT silently skip in-scope test files

The repository's ESLint configuration SHALL produce diagnostics (warnings or errors per the configured severity) for in-scope `*.test.{ts,tsx}` files; in-scope test files SHALL NOT be silently excluded by global-ignore patterns. This requirement guards against the prior structural bug at `eslint.config.js:51-73` where every test file was unconditionally ignored. The actual title-rule and AAA-rule contracts are normatively enforced by the two mechanical guards in `scripts/check-test-{title-should,aaa}.mjs` (see the requirements above); ESLint's `vitest/valid-title` rule provides IDE-time feedback that mirrors the title-rule's mechanical-guard verdict but is not itself the contract source of truth.

In-scope files SHALL match the same exclusion list documented under the title-rule requirement above (the rule-set is implementation-agnostic — the spec binds the contract, not the specific ESLint version's API).

Implementation: see `eslint.config.js`'s test-files override block. The block SHALL register `@vitest/eslint-plugin` and SHALL exempt out-of-scope paths (Playwright `e2e/`, Storybook stories, `test-utils/`, `test-setup.ts`).

#### Scenario: Test file lints under the test-files override block

- **WHEN** `pnpm lint` runs against any `*.test.{ts,tsx}` file under `packages/**`
- **THEN** the file SHALL be linted (not silently skipped)
- **AND** the test-files override block's relaxed rules SHALL apply

#### Scenario: Playwright e2e files are not subject to the title-rule

- **GIVEN** a Playwright spec at `packages/workout-spa-editor/e2e/calendar.spec.ts` calling `test("renders calendar", async () => …)`
- **WHEN** the title-guard or ESLint runs
- **THEN** the file SHALL NOT be flagged for non-conformant title (Playwright test() is out of scope per the e2e override)

### Requirement: Mechanical guards SHALL co-locate node:test suites

Both `scripts/check-test-title-should.mjs` and `scripts/check-test-aaa.mjs` SHALL ship with co-located `*.test.mjs` files following the existing `scripts/check-*.test.mjs` convention (temp-dir fixtures, `node:test` runner, exported function under test). Each test suite SHALL cover ≥ 8 branches and SHALL run as part of `pnpm test:scripts` (the floor matches tasks.md §1.5 / §1.7).

The husky `pre-commit` hook SHALL invoke `pnpm test:scripts`. The CI `lint` job SHALL invoke the same. No new top-level `pnpm` script SHALL be introduced for the test-conventions guards (D10 reuse-over-invention).

#### Scenario: New script-level test runs in the standard harness

- **WHEN** a contributor adds a new branch to `scripts/check-test-title-should.test.mjs`
- **THEN** the existing `pnpm test:scripts` harness SHALL pick it up automatically with no wiring change

#### Scenario: Pre-commit hook fails on convention violation

- **GIVEN** a developer commits a new test with `it("renders X")`
- **WHEN** the husky `pre-commit` hook fires
- **THEN** `pnpm test:scripts` SHALL fail
- **AND** the commit SHALL NOT proceed

### Requirement: Test-convention guards SHALL implement a `findings ⊆ allowlist` ratchet

The two mechanical guards (`scripts/check-test-title-should.mjs` and `scripts/check-test-aaa.mjs`) SHALL enforce the invariant `findings ⊆ allowlist` on every CI run: any violation discovered in a file path NOT in the guard's allowlist SHALL cause the guard to exit non-zero. Allowlists SHALL be exported as named Sets from each guard's source file (path-keyed string entries) so that PRs which add or remove entries are auditable at the diff level. The ratchet MUST exit non-zero regardless of whether the same PR also drains existing entries — i.e., progress on existing debt does not entitle a PR to introduce new debt.

The title-guard's allowlist SHALL be `new Set()` (empty). The AAA guard's allowlist SHALL be `new Set()` or hold ONLY entries justified by the escape-hatch table reproduced under "Requirement: `it(...)` bodies SHALL contain ..." above. Adding any allowlist entry that is NOT covered by the escape-hatch categories SHALL require an OpenSpec change amending this capability — not an ad-hoc PR.

#### Scenario: New PR introducing a new violation fails CI

- **GIVEN** a developer opens a PR introducing a new test file with `it("renders X")` (non-conformant title)
- **WHEN** CI runs `scripts/check-test-title-should.mjs`
- **THEN** the guard SHALL fail with the file path and line number in stderr
- **AND** the developer SHALL fix the title before merge — the allowlist SHALL NOT be re-introduced for individual additions

#### Scenario: PR adding a conformant test file remains green

- **GIVEN** a PR adds `pkg/foo.test.ts` containing only conformant `it("should …")` titles and AAA-marked bodies
- **WHEN** CI runs both guards
- **THEN** both guards SHALL find zero violations
- **AND** the PR SHALL pass CI

#### Scenario: PR accidentally regressing AAA markers in a previously-conformant file fails CI

- **GIVEN** a PR removes the `// Arrange` / `// Act` / `// Assert` markers from a previously-conformant file (now in violation, not in the allowlist)
- **WHEN** CI runs `scripts/check-test-aaa.mjs`
- **THEN** the guard SHALL fail with that file's path in stderr
- **AND** the PR SHALL block until the regression is reverted
