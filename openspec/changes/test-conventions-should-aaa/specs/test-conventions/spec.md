## ADDED Requirements

### Requirement: `it(...)` titles SHALL start with `should ` (dogma)

Every `it(...)`, `it.skip(...)`, `it.only(...)`, `it.todo(...)`, and `it.each([...])(...)` call in any `*.test.{ts,tsx}` file under `packages/**` SHALL pass a string-literal or template-literal first argument whose textual prefix (after stripping vitest substitution placeholders `%s`, `%d`, `%i`, `%j`, `%o`, `%#`, `$1`, `$2`, and named `$prop` references per vitest's `test.each` API) equals `should ` (the literal seven characters `s`, `h`, `o`, `u`, `l`, `d`, space).

Template literals with substitutions (e.g., `` it(`${prefix} renders X`) ``) SHALL be rejected with a parse error naming the file and line, because the static prefix cannot be verified. Authors SHALL re-shape such titles to embed `should ` as a literal prefix (e.g., `` it(`should render ${variant}`) ``).

`describe(...)` titles SHALL NOT be subject to this requirement. Describe blocks are noun-phrase agglomerators; the dogma applies only to test cases.

The ESLint rule `vitest/valid-title` from `@vitest/eslint-plugin` SHALL be configured with `mustMatch: { it: ['^should '] }` in the test-files block of `eslint.config.js`, providing IDE-time enforcement. The mechanical guard `scripts/check-test-title-should.mjs` SHALL be the source-of-truth enforcement, called by `pnpm test:scripts` (which is invoked by both husky `pre-commit` and the CI lint job). The guard SHALL exit non-zero (`process.exit(1)`) and print `<repo-relative-path>:<line>` for each violating call.

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

#### Scenario: Aliases `it.skip`, `it.only`, `it.todo` are subject to the same rule

- **WHEN** a developer writes `it.skip("renders X", () => { … })`
- **THEN** the guard SHALL fail with the same error message format as `it(...)`

#### Scenario: Template literal with substitution is rejected with parse error

- **WHEN** a developer writes `` it(`${prefix} renders X`, () => { … }) `` where `prefix` is a runtime variable
- **THEN** the guard SHALL exit non-zero with a parse-error message stating that the static prefix cannot be verified
- **AND** the recommended remediation SHALL be: rewrite as `` it(`should render X with ${variant}`) ``

### Requirement: `it(...)` bodies SHALL contain `// Arrange`, `// Act`, `// Assert` markers in order

Every `it(...)` body in any `*.test.{ts,tsx}` file under `packages/**` (excluding files in the AAA escape-hatch table below) SHALL contain three line comments in this exact order: `// Arrange` → `// Act` → `// Assert`. The match is case-insensitive (`// arrange`, `// act`, `// assert` are accepted). Each comment MUST be a standalone line comment occupying its own line; trailing same-line comments SHALL NOT match. Comments MAY include trailing whitespace and trailing punctuation (`// Arrange:`, `// Arrange.`); the regex is `^\s*(Arrange|Act|Assert)\s*[:.]?\s*$/i`.

Each section MAY contain zero or more statements. An empty section is permitted (the marker comment is present, the section body is empty); an empty section SHALL be explicit, not implicit.

Sections SHALL be separated by exactly one blank line (TS source-line gap of ≥ 1) between the last statement of section N and the comment line of section N+1. Multiple blank lines are tolerated; zero blank lines are rejected.

The mechanical guard `scripts/check-test-aaa.mjs` SHALL enforce this requirement at file granularity (D4 file-level allowlist). A file is either fully conformant (every `it(...)` body contains the three markers in order) or fully covered by the escape-hatch allowlist. Per-`it` exemptions SHALL NOT be supported.

The escape-hatch allowlist SHALL be initialized empty after this change archives and SHALL grow only through subsequent OpenSpec changes. Permitted categories at this change's archive time:

| Category                                                | Why exempt                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| `*.integration.test.ts` against external network APIs   | Setup is harness-driven (`beforeAll` connects); per-`it` Arrange is empty by harness contract. |
| Table-driven `it.each([...])` where every row is `[input, expected]` | The Arrange is the table; per-`it` Arrange is empty by data-driven design. |
| Generated fixture loaders (`@kaiord/core/test-utils`)   | Files are generated; reformatting is overwritten on next regen. |

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

#### Scenario: Lower-case marker variants are accepted

- **GIVEN** a test body using `// arrange` / `// act` / `// assert` (lower-case)
- **WHEN** the guard runs
- **THEN** it SHALL exit zero (case-insensitive regex)

#### Scenario: Escape-hatch file passes regardless of body shape

- **GIVEN** a file `packages/garmin-connect/src/index.integration.test.ts` is in the escape-hatch allowlist with category "integration test against external network APIs"
- **WHEN** the guard runs
- **THEN** the file SHALL be skipped silently and not contribute to the violation count

### Requirement: ESLint flat-config SHALL lint test files

The `eslint.config.js` global `ignores` block SHALL NOT contain `**/*.test.ts`, `**/*.test.tsx`, `**/*.test.js`, `**/*.spec.ts`, or `**/tests/**/*.ts`. The test-files override block SHALL be reachable and SHALL apply the relaxed test rules (max-lines off, magic-numbers warn, etc.) plus the `vitest/valid-title` rule from `@vitest/eslint-plugin`.

The Playwright e2e fixture path `packages/workout-spa-editor/e2e/**/*.ts` retains its existing override (no react-hooks rules) and SHALL NOT be subject to the title-rule (Playwright `test()` calls follow Playwright conventions, not Vitest).

#### Scenario: Test file lints under the test-files override block

- **WHEN** `pnpm lint` runs against any `*.test.{ts,tsx}` file under `packages/**`
- **THEN** the file SHALL be linted (not silently skipped)
- **AND** the test-files override block's relaxed rules SHALL apply

#### Scenario: Playwright e2e files are not subject to the title-rule

- **GIVEN** a Playwright spec at `packages/workout-spa-editor/e2e/calendar.spec.ts` calling `test("renders calendar", async () => …)`
- **WHEN** the title-guard or ESLint runs
- **THEN** the file SHALL NOT be flagged for non-conformant title (Playwright test() is out of scope per the e2e override)

### Requirement: Mechanical guards SHALL co-locate node:test suites

Both `scripts/check-test-title-should.mjs` and `scripts/check-test-aaa.mjs` SHALL ship with co-located `*.test.mjs` files following the existing `scripts/check-*.test.mjs` convention (temp-dir fixtures, `node:test` runner, exported function under test). Each test suite SHALL cover ≥ 7 branches and SHALL run as part of `pnpm test:scripts`.

The husky `pre-commit` hook SHALL invoke `pnpm test:scripts`. The CI `lint` job SHALL invoke the same. No new top-level `pnpm` script SHALL be introduced for the test-conventions guards (D10 reuse-over-invention).

#### Scenario: New script-level test runs in the standard harness

- **WHEN** a contributor adds a new branch to `scripts/check-test-title-should.test.mjs`
- **THEN** the existing `pnpm test:scripts` harness SHALL pick it up automatically with no wiring change

#### Scenario: Pre-commit hook fails on convention violation

- **GIVEN** a developer commits a new test with `it("renders X")`
- **WHEN** the husky `pre-commit` hook fires
- **THEN** `pnpm test:scripts` SHALL fail
- **AND** the commit SHALL NOT proceed

### Requirement: Migration allowlists SHALL drain monotonically (ratchet)

During the migration window (PR-1 ships with full allowlists; PR-6 ships with empty allowlists or D7-only escape-hatch entries), every PR that modifies a test file SHALL satisfy `findings ⊆ allowlist`. New violations introduced in a PR SHALL fail CI on the same PR's run, regardless of whether the diff also drains existing allowlist entries.

The allowlist Sets SHALL be exported from each guard file (`scripts/check-test-title-should.mjs:ALLOWLIST` and `scripts/check-test-aaa.mjs:ALLOWLIST`) so that migration PRs' diffs show the drained entries explicitly. Drift in the allowlist SHALL be auditable at the diff level — any PR that adds an entry SHALL include in its description the justification (typically: "moved to D7 escape-hatch category X").

#### Scenario: Migration PR drains entries and stays green

- **GIVEN** PR-3 (AAA on backend packages) drains 168 file paths from `scripts/check-test-aaa.mjs:ALLOWLIST`
- **WHEN** the PR's CI runs
- **THEN** the guard SHALL find zero violations in those 168 files
- **AND** the PR SHALL pass CI

#### Scenario: Migration PR introduces a new violation by accident

- **GIVEN** PR-3 drains 168 entries but a subagent accidentally edits a test in a 169th file removing its existing AAA markers
- **WHEN** the PR's CI runs
- **THEN** the guard SHALL fail with the 169th file path in stderr
- **AND** the PR SHALL block until either (a) the file is restored, (b) the file is added to the allowlist with explicit justification

#### Scenario: New PR after migration adds a new violation

- **GIVEN** the migration is complete (PR-6 archived) and ALLOWLISTs are empty
- **WHEN** a developer opens a PR introducing a new test file with `it("renders X")` (non-conformant title)
- **THEN** the title-guard SHALL fail with the file path in stderr
- **AND** the developer SHALL fix the title before merge — the allowlist SHALL NOT be re-introduced for individual additions
