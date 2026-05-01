## ADDED Requirements

### Requirement: Architecture boundary check

The repository SHALL enforce hexagonal-architecture layer rules via a static-source check at `scripts/check-architecture.mjs`, executed in CI via `pnpm test:scripts` and locally via the husky `pre-commit` hook. The full rule set, rule IDs, and scenarios are normatively defined in the `hexagonal-arch` capability spec; this requirement establishes the gate as a member of the repo-wide quality-gate set.

The script's `ALLOWLIST` MUST be the empty Set before this change is archived. Allowlist additions follow the same reviewer-gated process as `scripts/check-no-pii-leakage.mjs`: each entry MUST carry an inline comment naming (a) the rule ID, (b) the offending file/path, and (c) the planned drain (PR number or follow-up change slug).

#### Scenario: Architecture check is part of pnpm test:scripts

- **WHEN** a contributor runs `pnpm test:scripts` at the repo root
- **THEN** the test suite SHALL include `scripts/check-architecture.test.mjs` and the suite SHALL exit non-zero if `scripts/check-architecture.mjs` reports any violation

### Requirement: Mapper files SHALL NOT have tests

The repository SHALL contain a static-source check at `scripts/check-mapper-no-tests.mjs` that fails if any path matching `packages/**/*.mapper.test.{ts,tsx}` exists, excluding `node_modules/` and `dist/`. The rule ID is `R-MapperNoTests`. The script SHALL be tested by `scripts/check-mapper-no-tests.test.mjs` (`node:test`) and wired into `pnpm test:scripts`.

The rule codifies the `testing-standards` and `design-principles` invariant that `*.mapper.ts` files perform pure field-to-field transformations and therefore have nothing testable beyond what their consumers' tests already cover. A mapper that grows non-trivial logic MUST be renamed to `*.converter.ts` (which then MUST have tests under the inverse rule).

The script's `ALLOWLIST` MUST be the empty Set before this change is archived.

#### Scenario: Mapper-with-test is rejected

- **GIVEN** a file `packages/<pkg>/src/<path>.mapper.test.ts`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-MapperNoTests`, the offending test file path, and the suggested fix `delete the test or rename both source and test to *.converter.{ts,tsx}`

### Requirement: Converter files SHALL have tests

The repository SHALL contain a static-source check at `scripts/check-converter-has-tests.mjs` that fails if any path matching `packages/**/*.converter.{ts,tsx}` exists without a sibling `*.converter.test.{ts,tsx}` file. The rule ID is `R-ConverterHasTests`. The script SHALL be tested by `scripts/check-converter-has-tests.test.mjs` and wired into `pnpm test:scripts`.

The check MUST consider only files in the same directory as the converter (`./<basename>.test.{ts,tsx}`), not nested test folders. Non-trivial logic that lives in a converter without a co-located test is a `testing-standards` violation regardless of indirect coverage from integration suites.

The script's `ALLOWLIST` MUST be the empty Set before this change is archived.

#### Scenario: Converter without sibling test is rejected

- **GIVEN** the repository contains `packages/zwo/src/adapters/krd-to-zwift.converter.ts` and no `packages/zwo/src/adapters/krd-to-zwift.converter.test.ts`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-ConverterHasTests`, the converter path, and the missing-test path

### Requirement: No unconditional skipped tests

The repository SHALL contain a static-source check at `scripts/check-no-unconditional-skip.mjs` that fails on any of: `it.skip`, `test.skip`, `describe.skip`, `it.only`, `test.only`, `describe.only`, `it.todo`, `test.todo` call-expression access in any `*.test.{ts,tsx}` or `*.spec.{ts,tsx}` file under `packages/`. The rule ID is `R-NoUnconditionalSkip`. The script SHALL be tested by `scripts/check-no-unconditional-skip.test.mjs` and wired into `pnpm test:scripts`.

> Note on `it.todo`: rejection is currently unconditional. The team is aware this conflicts with Vitest's planned-test workflow; a follow-up `repo-quality-gates` change may revisit this decision (Open Question 2 in the proposal). Contributors blocked by this rule SHOULD open an issue rather than work around it with an empty `it("planned", () => {})`.

The check SHALL recognize and reject all four syntactic dispatch shapes (mirroring the precedent in `scripts/check-no-pii-leakage.mjs`):

1. **Member dispatch**: `it.skip(...)`, `test.only(...)`, `describe.todo(...)`.
2. **Computed-member dispatch**: `it["skip"](...)`, `test["only"](...)`, `describe["todo"](...)`.
3. **Destructured dispatch**: `const { skip } = it; skip(...);` — the script tracks `it`/`test`/`describe` destructurings within a file and treats subsequent calls to those bound names under the same rule.
4. **Re-bound dispatch**: `const myIt = it; myIt.skip(...);` — the script tracks `const X = it|test|describe` rebindings and treats `<X>.<method>(...)` under the same rule.

The check SHALL allow the conditional forms `it.skipIf(<expr>)`, `test.skipIf(<expr>)`, `describe.skipIf(<expr>)` ONLY when `<expr>` contains at least one AST node of kind `Identifier`, `MemberExpression`, `CallExpression`, or `NewExpression`. All other constructs (literals; template literals without `${...}` substitutions; unary, binary, or logical expressions whose every reachable leaf is a literal — e.g., `!!1`, `1 + 1`, `true && true`) SHALL be rejected as literal-only because they are functionally equivalent to an unconditional skip. `NewExpression` is included so legitimate runtime forms like `skipIf(new URL(import.meta.url).hostname === "ci")` pass; the constructor invocation contributes runtime evaluation. The check SHALL apply the same four-shape dispatch detection to `skipIf` so a contributor cannot bypass via `it["skipIf"](true)` or destructured/re-bound forms.

A test that cannot run unconditionally MUST take one of the three paths in `R-NoUnconditionalSkip`:

- **Path (a) — `skipIf(<runtime-expr>)`**: env-gated or feature-detected, e.g., `describe.skipIf(!process.env.GARMIN_EMAIL)`.
- **Path (b) — fast-path replacement**: replace the skipped block with a deterministic test that asserts only what is currently true.
- **Path (c) — deletion**: remove the test if the behavior is no longer relevant (with reasoning in the PR description).

The script's `ALLOWLIST` MUST be the empty Set before this change is archived.

The husky `pre-commit` hook SHALL run `pnpm test:scripts` BEFORE `pnpm test`, so an `it.only` call (which silently masks every other test in a file) is rejected before the test runner gets a chance to report a green run on a single test.

#### Scenario: Unconditional skip via dotted member is rejected

- **GIVEN** a file `packages/<pkg>/src/<path>.test.ts` containing `it.skip("renders", () => {})`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-NoUnconditionalSkip`, the file path, and the line number

#### Scenario: Unconditional skip via computed member is rejected

- **GIVEN** a file containing `it["skip"]("renders", () => {})`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-NoUnconditionalSkip`, the file path, and the line number

#### Scenario: Unconditional skip via destructured dispatch is rejected

- **GIVEN** a file containing `const { skip } = it; skip("renders", () => {});`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-NoUnconditionalSkip`, the file path, and the line number of the `skip(...)` call

#### Scenario: Unconditional skip via re-bound dispatch is rejected

- **GIVEN** a file containing `const myIt = it; myIt.skip("renders", () => {});`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-NoUnconditionalSkip`, the file path, and the line number of the `myIt.skip(...)` call

#### Scenario: skipIf with literal-only argument is rejected

- **GIVEN** a file containing `it.skipIf(true)("blocked", () => {})` (or any of `skipIf(1)`, `skipIf("x")`, `skipIf(null)`, `skipIf(!!1)`, `skipIf(1+1)`, `skipIf(true && true)`)
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-NoUnconditionalSkip` and the message `skipIf argument must contain at least one Identifier, MemberExpression, or CallExpression`

#### Scenario: skipIf with runtime expression is allowed

- **GIVEN** a file containing `describe.skipIf(!process.env.GARMIN_EMAIL || !process.env.GARMIN_PASSWORD)("Garmin Connect Integration", ...)`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with code 0 and stderr does NOT contain `R-NoUnconditionalSkip` for this file

### Requirement: Conventional-commit format gate

The repository SHALL enforce conventional-commit format on every commit message via a husky `commit-msg` hook backed by `@commitlint/cli` and `@commitlint/config-conventional`. A repo-root `commitlint.config.mjs` SHALL import its `type-enum` and `scope-enum` arrays from `commitlint.vocab.mjs` (a single source-of-truth module exporting `TYPE_ENUM` and `SCOPE_ENUM` const arrays). The same arrays SHALL be reproduced verbatim, line-for-line and order-preserved, inside a fenced block in `.claude/skills/guidelines/git-strategy/SKILL.md` between the markers `<!-- commitlint-source-of-truth:start -->` and `<!-- commitlint-source-of-truth:end -->`.

The test in `scripts/check-commitlint-config.test.mjs` SHALL parse the SKILL.md block, dynamically import `commitlint.vocab.mjs`, and assert the two arrays are EXACTLY equal in both contents and order (array-equality, not Set-equality). Drift in either direction MUST fail CI. Order is normative because the SKILL.md block is read top-to-bottom by contributors; reordering it changes the doc's meaning even when the runtime behavior is unchanged.

- **type-enum** (level=2, "always"): `feat | fix | chore | test | docs | refactor | perf`
- **scope-enum** (level=2, "always"): `core | fit | tcx | zwo | garmin | garmin-connect | ai | cli | mcp | spa-editor | garmin-bridge | train2go-bridge | analytics | landing | docs-site | openspec | ci | docs | scripts | deploy | release | deps | deps-dev | e2e`

The husky `commit-msg` hook SHALL invoke `pnpm exec commitlint --edit "$1"` and exit non-zero on any violation. The rule ID surfaced in failures is `R-CommitFormat`. The hook script SHALL prepend a one-line `R-CommitFormat:` prefix to commitlint's output for traceability.

Multi-scope commit subjects (e.g., `refactor(core,fit,tcx): foo`) SHALL be REJECTED. The default `@commitlint/config-conventional` behavior is preserved (no `scope-enum-multiple` opt-in). The test in `scripts/check-commitlint-config.test.mjs` SHALL pipe a multi-scope subject through `pnpm exec commitlint` and assert non-zero exit.

#### Scenario: Commit using `openspec:` as a TYPE is rejected

- **WHEN** a contributor runs `git commit -m "openspec: archive cleanup-may-2026"`
- **THEN** the husky `commit-msg` hook exits with a non-zero code and stderr contains `R-CommitFormat` and a message indicating that `openspec` is a SCOPE, not a TYPE; the suggested replacement is `chore(openspec): archive cleanup-may-2026`

#### Scenario: Commit with unknown scope is rejected

- **WHEN** a contributor runs `git commit -m "feat(banana): add new flow"`
- **THEN** the husky `commit-msg` hook exits with a non-zero code and stderr contains `R-CommitFormat` and the allowed scope vocabulary

#### Scenario: Multi-scope commit subject is rejected

- **WHEN** a contributor runs `git commit -m "refactor(core,fit,tcx): unify foo"`
- **THEN** the husky `commit-msg` hook exits with a non-zero code and stderr contains `R-CommitFormat` indicating multi-scope subjects are not allowed; contributors split the commit per scope

#### Scenario: Drift between commitlint config and guideline doc is rejected

- **GIVEN** a contributor adds `"banana"` to `commitlint.vocab.mjs` `SCOPE_ENUM` without updating the `<!-- commitlint-source-of-truth -->` block in `git-strategy/SKILL.md`
- **WHEN** `pnpm test:scripts` runs
- **THEN** `scripts/check-commitlint-config.test.mjs` fails with a message naming the diverging entry and the two file paths

#### Scenario: Reordering scopes in either source fails the drift test

- **GIVEN** a contributor reorders the SCOPE_ENUM array in `commitlint.vocab.mjs` (e.g., moves `core` to the end) without making the matching reorder in `git-strategy/SKILL.md`
- **WHEN** `pnpm test:scripts` runs
- **THEN** `scripts/check-commitlint-config.test.mjs` fails because the comparison is array-equality (order-sensitive)

### Requirement: Pre-commit hook does not normalize its own bypass

The husky `pre-commit` hook (`.husky/pre-commit`) and any other file under `.husky/` SHALL NOT contain any line that ENDORSES, INSTRUCTS, or PROVIDES a recipe for bypassing the hook. The forbidden patterns target the _imperative-voice_ framing only:

- `commit --no-verify` preceded by an instruction-form word (`use`, `try`, `run`, `execute`, `:` in a colon-separated list, or appearing inside a here-doc / printf / echo statement).
- `HUSKY=0` set as an exported variable, suggested in stdout, or in a printed multi-line block.

Defensive comments such as `# NEVER use --no-verify; CI re-runs all checks anyway` are EXPLICITLY ALLOWED and MUST NOT trigger the rule, because they reinforce the policy rather than normalize the bypass.

The repository SHALL contain `scripts/check-husky-no-bypass-hint.mjs` (+ co-located `*.test.mjs`) implementing this distinction. The rule ID is `R-NoBypassHint`. The script SHALL parse each file under `.husky/` line-by-line and reject only lines where `--no-verify` or `HUSKY=0` appears AFTER an instruction-form keyword (regex roughly `/(use|try|run|execute|:|echo|printf)\s.*(--no-verify|HUSKY=0)/i`) AND NOT preceded on the same line by `NEVER`, `do not`, `don't`, or `forbidden`. The script SHALL be wired into `pnpm test:scripts` and `pnpm lint`.

GPG signing policy is OUT OF SCOPE for this rule. `--no-gpg-sign` is a separate concern (signing, not hook-bypass) and is NOT enforced by `R-NoBypassHint`. A future `repo-quality-gates` change MAY add a `R-NoGpgBypass` rule if the team adopts mandatory GPG signing.

#### Scenario: Imperative bypass instruction is rejected

- **GIVEN** `.husky/pre-commit` contains the line `echo "To skip this check: git commit --no-verify"`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-NoBypassHint`, the file path, and the offending line

#### Scenario: Defensive comment is allowed

- **GIVEN** `.husky/pre-commit` contains the line `# NEVER use --no-verify; CI re-runs all checks anyway`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with code 0 and stderr does NOT contain `R-NoBypassHint` for this line

#### Scenario: CI re-runs the same gates after every push

- **WHEN** a contributor pushes a branch where the husky hook was bypassed (e.g., commits made with `git commit --no-verify`)
- **THEN** the GitHub Actions CI workflow re-runs `pnpm test:scripts` AND `pnpm exec commitlint --from <merge-base> --to HEAD`, and any violation introduced by the bypassed commits fails the PR check

### Requirement: All ALLOWLISTs drain to empty

After this change is archived, every `scripts/check-*.mjs` file SHALL declare its `ALLOWLIST` as either `new Set()` or `new Set([])` (an empty Set literal — no file paths, no `// TODO` entries between the brackets). Both forms are accepted because they are functionally identical and the existing `scripts/check-no-pii-leakage.mjs` precedent uses `new Set([])`. The repository SHALL contain `scripts/check-allowlists-empty.mjs` (+ co-located `*.test.mjs`) that fails if any `scripts/check-*.mjs` file contains a `ALLOWLIST = new Set([` literal followed by any non-`]` character — i.e., a non-empty Set literal. The rule ID is `R-AllowlistsEmpty`. The script SHALL be wired into `pnpm test:scripts` and `pnpm lint`.

This invariant is permanent: once a guard's allowlist drains during `guidelines-compliance-harden`, no future PR may re-seed it without an OpenSpec change explicitly amending this requirement.

#### Scenario: Re-seeded allowlist is rejected

- **GIVEN** a contributor adds `"packages/X/Y.ts"` to `ALLOWLIST` in any `scripts/check-*.mjs` file in a PR after `guidelines-compliance-harden` archives
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-AllowlistsEmpty`, the offending script, and a pointer to the spec requirement that forbids re-seeding without an OpenSpec amendment
