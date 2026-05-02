> Synced: 2026-05-01 (guidelines-compliance-harden)

# SPA Quality Gates

## Purpose

Mechanically enforced repo-wide quality gates implemented as static-source `pnpm test:scripts` checks. Each requirement specifies a structural rule the SPA editor source code SHALL obey, plus the script that enforces it in CI.
## Requirements
### Requirement: User-facing string hygiene

User-facing strings rendered by the SPA editor — invocations of `useToastContext().{error,success,info,warning}(...)`, `toast.{error,success,info,warning}(...)`, and `console.{log,warn,error,info,debug}(...)` under `packages/workout-spa-editor/src/{components,hooks,lib}/**` (excluding `*.test.{ts,tsx}` and `*.stories.{ts,tsx}`) — SHALL pass a single first argument that resolves at audit time to a static string.

A first argument is "static" when it matches one of exactly two shapes:

1. **A bare string literal**: `toast.error("Failed to save profile")`.
2. **A bare SCREAMING_SNAKE_CASE identifier** (matching `/^[A-Z][A-Z0-9_]*$/`) that resolves to a top-level `const <ID>` declaration in the same file whose right-hand side is **directly** a bare string literal — no template, no concatenation, no function call, no other identifier (depth-1 only; chains are rejected).

The following first-argument shapes are forbidden:

- Template literals with substitutions (e.g., `` `Failed to save: ${error.message}` ``).
- String concatenation expressions (e.g., `"Failed: " + error.message`).
- Function calls (e.g., `formatError(err)`, even when assigned to a top-level const before the toast call).
- Identifiers resolving to a `catch (err)` binding, function parameter, or any closure-captured / non-top-level variable.
- Bare lowercase or camelCase identifiers (only SCREAMING_SNAKE_CASE constants are accepted).
- Identifier chains (e.g., `const A = B; const B = "x"; toast.error(A);`) — the rule is depth-1 only.
- TypeScript type-assertions on the argument (e.g., `SAVE_FAILED as string`, `<string>SAVE_FAILED`, `SAVE_FAILED satisfies string`).
- Post-fix non-null and `as const` operators on the argument (e.g., `SAVE_FAILED!`, `SAVE_FAILED as const`).
- Unary operators on the argument (e.g., `void "Failed"`, `+SAVE_FAILED`).
- Parenthesized expressions wrapping the argument (e.g., `("Failed")`) — strip the parentheses.

The rule is **structural and mechanical**: forbidding interpolation in any form prevents any field — including but not limited to `apiKey`, `externalUserId`, `externalUserName`, `email`, and `error.message` — from leaking into a user-visible string or a persistent console log. The static guard does NOT match identifier names or substring patterns; it only matches argument-shape syntax. Identifier-name awareness lives entirely in the **reviewer-side** allowlist criteria below; the two layers (mechanical script enforcement, human reviewer gate on allowlist additions) are deliberately separated.

The script SHALL recognize four call-site dispatch shapes so contributors cannot bypass via syntactic indirection:

1. **Member dispatch**: `toast.error(...)`, `useToastContext().error(...)`, `console.error(...)`, etc.
2. **Computed-member dispatch**: `toast["error"](...)`, `useToastContext()["error"](...)` — the bracket form is forbidden but if used MUST be checked with the same rule.
3. **Destructured dispatch**: `const { error } = useToastContext(); error(...);` — the script tracks `useToastContext()` destructurings within a file and treats subsequent calls to those bound names as in-scope.
4. **Re-bound dispatch**: `const ctx = useToastContext(); ctx.error(...);` — the script tracks `const <ID> = useToastContext()` rebindings within a file and treats subsequent `<ID>.<method>(...)` calls as member dispatch under the same rule. If a file contains conflicting bindings (e.g., two `const { error } = ...` from different sources, or both a re-bind and a destructure), the script treats every potentially-toast call as in-scope (false-positive bias is the safe default; the contributor either renames the conflict or refactors).

A static guard at `scripts/check-no-pii-leakage.mjs`, executed in CI via `pnpm test:scripts`, SHALL enforce this rule across all four dispatch shapes. The script SHALL maintain a hard-coded allowlist mechanism — a Set of file paths where a legitimate exception is documented inline. **The initial production allowlist MUST be empty.** The SHALL on the allowlist applies to the _mechanism_ (an exported `ALLOWLIST` Set the test fixture can manipulate), not to the _contents_. Allowlist entries are added only via PRs that satisfy reviewer-gated criteria below. Each allowlist entry MUST carry a comment block satisfying two criteria:

1. The interpolated value originates from the same user's same-render-frame input and never traverses a network boundary, persistent log, or analytics event.
2. The interpolated value is not read from any field that the team's PII / secret classification considers sensitive. Illustrative (non-exhaustive) examples: `apiKey`, `externalUserId`, `externalUserName`, `email`, `phone`, `address`. Reviewers apply the spirit of this criterion to new field names not on the list (e.g., `ssn`, `dob`, `latitude`/`longitude`).

Reviewers cite these criteria when accepting or rejecting allowlist additions. The initial allowlist is empty. The two criteria are reviewer-gated, not script-enforced — the script's structural rule is the mechanical layer; this allowlist is the controlled escape hatch.

The rule supersedes the file-local audit at `packages/workout-spa-editor/src/components/organisms/SettingsPanel/use-ai-tab-handlers.audit.test.ts` in scope (the broader script covers the same surface plus more) but does NOT replace it: the file-local audit is kept as defense-in-depth per CLAUDE.md's "Never delete a test" rule.

#### Scenario: Toast string with template-literal interpolation is rejected

- **WHEN** a contributor adds a `toast.error(\`Failed: ${error.message}\`)`call in any file under`packages/workout-spa-editor/src/{components,hooks,lib}/\*\*` not on the allowlist
- **THEN** `pnpm test:scripts` SHALL fail in CI with rule `R-PIIInterpolation`, naming the offending file, line number, and call expression, blocking the merge

#### Scenario: Concatenation with a closure-captured error is rejected

- **WHEN** a contributor adds a `console.error("Failed: " + err.message)` call in any file under the scoped paths not on the allowlist
- **THEN** `pnpm test:scripts` SHALL fail with rule `R-PIIInterpolation`, naming the offending file, line number, and call expression

#### Scenario: Identifier reference to a `catch` / function-parameter binding is rejected

- **WHEN** a `try { ... } catch (err) { const msg = err.message; toast.error(msg); }` block is added in a scoped file, where `msg` is a local (non-top-level) const
- **THEN** the static guard SHALL reject the call: `msg` is not a top-level SCREAMING_SNAKE_CASE constant resolving to a string literal, so it fails the rule

#### Scenario: Helper-call indirection at definition time is rejected

- **WHEN** a top-level declaration `const SAVE_FAILED = formatError(err);` is added (RHS is a `CallExpression`, not a string literal) and used as `toast.error(SAVE_FAILED);`
- **THEN** the static guard SHALL reject the call: `SAVE_FAILED` is a top-level SCREAMING_SNAKE_CASE identifier, but the depth-1 lookup of its declaration finds `formatError(err)` (a call expression) on the right-hand side, not a string literal

#### Scenario: Computed-member dispatch is rejected

- **WHEN** a contributor writes `toast["error"](\`Failed: ${err.message}\`)` in any file under the scoped paths not on the allowlist
- **THEN** the script's computed-member dispatch regex catches the bracket form, runs the same shape check on the first argument, and fails with rule `R-PIIInterpolation` because the argument is a template literal

#### Scenario: Destructured dispatch is rejected

- **WHEN** a contributor writes `const { error } = useToastContext(); error(\`Failed: ${err.message}\`);` in a scoped file
- **THEN** the script's destructure scan binds `error` to the toast context within that file, treats the subsequent `error(...)` call as in-scope, runs the shape check, and fails with rule `R-PIIInterpolation`

#### Scenario: Re-bound dispatch is rejected

- **WHEN** a contributor writes `const ctx = useToastContext(); ctx.error(\`Failed: ${err.message}\`);` in a scoped file
- **THEN** the script's re-binding scan binds `ctx` to the toast context, treats the subsequent `ctx.error(...)` call as member dispatch on a known toast receiver, runs the shape check, and fails with rule `R-PIIInterpolation`

#### Scenario: Identifier chain is rejected (depth-1 only)

- **WHEN** a contributor writes `const A = B; const B = "x"; toast.error(A);` in a scoped file
- **THEN** the script's depth-1 lookup of `A` finds `const A = B` (RHS is the identifier `B`, not a string literal), and rejects with rule `R-PIIInterpolation`. Transitive resolution (`A → B → "x"`) is intentionally not supported per design D8

#### Scenario: Bare string literal (including inner colons / plus signs) is accepted

- **WHEN** any of `toast.error("Failed to save profile")`, `toast.error("URL: https://example.com")`, or `toast.error("a + b > c")` is parsed in a scoped file
- **THEN** the static guard SHALL accept the call without flagging the inner `:`, `/`, `+`, or `>` characters — bare-literal acceptance runs BEFORE rejection char-class checks

#### Scenario: Bare SCREAMING_SNAKE_CASE identifier with literal RHS is accepted

- **WHEN** a `toast.error(SAVE_FAILED_TOAST)` call is parsed in any scoped file, AND the same file declares `const SAVE_FAILED_TOAST = "Failed to save profile";` at module top-level (RHS is exactly a bare string literal, depth-1 only)
- **THEN** the static guard SHALL accept the call

#### Scenario: Allowlisted file with a template literal passes (test-injected)

- **WHEN** the production allowlist (initially empty per the requirement body) is augmented in a test fixture by inserting a path into the exported `ALLOWLIST` Set, AND that file contains a template-literal toast call
- **THEN** the static guard SHALL accept the call. The scenario exercises the escape-hatch mechanic via test injection; production allowlist additions require reviewer-gated D9-criteria compliance and are not exercised here

#### Scenario: Post-rollout codebase passes the static check

- **WHEN** `node scripts/check-no-pii-leakage.mjs` runs against the SPA editor source tree on the merge commit that closes this rollout
- **THEN** the script exits 0 with `✅ No PII / secret leakage detected.`

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

The check SHALL recognize and reject all four syntactic dispatch shapes:

1. **Member dispatch**: `it.skip(...)`, `test.only(...)`, `describe.todo(...)`.
2. **Computed-member dispatch**: `it["skip"](...)`, `test["only"](...)`, `describe["todo"](...)`.
3. **Destructured dispatch**: `const { skip } = it; skip(...);` and renames `const { only: myOnly } = test;` — the script tracks depth-1 destructurings of `skip`, `only`, `todo`, and `skipIf` from `it`/`test`/`describe` and treats subsequent calls to those bound names under the same rule.
4. **Re-bound dispatch**: `const myIt = it; myIt.skip(...);` — the script tracks depth-1 `const X = it|test|describe` rebindings and treats `<X>.<method>(...)` under the same rule.

Chain re-binds (e.g., `const my = it; const { skip } = my; skip(...)`) remain documented residual risk — vanishingly rare in practice and not depth-1.

#### Allowance: `*.todo` with non-expired deadline comment

The check SHALL allow `*.todo(...)` calls (across all four dispatch shapes) when the line **immediately above** the call contains a comment of the form `// TODO(YYYY-MM-DD): <reason>` whose date is not yet expired (compared against the current system date). The date format is strictly `YYYY-MM-DD`. The deadline allowance applies ONLY to `*.todo` — `*.skip` and `*.only` remain unconditionally rejected. When the deadline passes, CI fails with the expired date in the message until the test is implemented or the deadline is extended via PR.

The check SHALL allow the conditional forms `it.skipIf(<expr>)`, `test.skipIf(<expr>)`, `describe.skipIf(<expr>)` ONLY when `<expr>` contains at least one AST node of kind `Identifier`, `MemberExpression`, `CallExpression`, or `NewExpression`. All other constructs (literals; template literals without `${...}` substitutions; unary, binary, or logical expressions whose every reachable leaf is a literal — e.g., `!!1`, `1 + 1`, `true && true`) SHALL be rejected as literal-only because they are functionally equivalent to an unconditional skip. `NewExpression` is included so legitimate runtime forms like `skipIf(new URL(import.meta.url).hostname === "ci")` pass; the constructor invocation contributes runtime evaluation. The check SHALL apply the same four-shape dispatch detection to `skipIf` so a contributor cannot bypass via `it["skipIf"](true)` or destructured/re-bound forms.

A test that cannot run unconditionally MUST take one of the four paths in `R-NoUnconditionalSkip`:

- **Path (a) — `skipIf(<runtime-expr>)`**: env-gated or feature-detected, e.g., `describe.skipIf(!process.env.GARMIN_EMAIL)`.
- **Path (b) — fast-path replacement**: replace the skipped block with a deterministic test that asserts only what is currently true.
- **Path (c) — deletion**: remove the test if the behavior is no longer relevant (with reasoning in the PR description).
- **Path (d) — `*.todo` with deadline**: only for planned tests; an immediately-preceding `// TODO(YYYY-MM-DD): reason` comment with a non-expired date.

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

#### Scenario: it.todo with non-expired deadline is allowed

- **GIVEN** a file containing two adjacent lines `// TODO(2030-01-01): finish auth flow` followed by `it.todo("auth flow", () => {});`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with code 0 and stderr does NOT contain `R-NoUnconditionalSkip` for this file

#### Scenario: it.todo with expired deadline is rejected

- **GIVEN** a file containing two adjacent lines `// TODO(2020-01-01): finish auth flow` followed by `it.todo("auth flow", () => {});`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-NoUnconditionalSkip`, the file path, and the literal substring `expired` and the date `2020-01-01`

#### Scenario: it.todo with no deadline comment is rejected

- **GIVEN** a file containing `it.todo("auth flow", () => {});` with no immediately-preceding `// TODO(YYYY-MM-DD): ...` comment
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-NoUnconditionalSkip` and the message `no deadline comment`

#### Scenario: deadline allowance does NOT apply to .skip

- **GIVEN** a file containing `// TODO(2030-01-01): fix later` immediately followed by `it.skip("renders", () => {});`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the process exits with a non-zero code and stderr contains `R-NoUnconditionalSkip` for the `.skip` call (the deadline allowance applies only to `.todo`)

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

### Requirement: React Rules-of-Hooks lint gate

The `eslint-plugin-react-hooks` plugin SHALL be registered in the repo-root `eslint.config.js` for the `packages/workout-spa-editor/**/*.{ts,tsx}` files block, with:

- `react-hooks/rules-of-hooks` set to `error`.
- `react-hooks/exhaustive-deps` set to `error`.

The SPA-pages files block (`packages/workout-spa-editor/**/pages/**/*.tsx`) inherits the plugin via the flat-config cascade — no separate registration is required for that block.

This gate is enforced by `pnpm lint` (specifically by the ESLint step within it) — distinct from the static-source `pnpm test:scripts` checks that enforce most other gates in this capability. CI MUST fail when either rule produces any error in the SPA editor sources. Pre-existing violations exposed by activating the plugin MUST be fixed (zero-tolerance policy from `CLAUDE.md`); a temporary `eslint-disable-next-line` is permitted only when paired with a TODO comment referencing an open issue.

#### Scenario: rules-of-hooks blocks a hook call inside useEffect

- **WHEN** SPA editor source contains a hook call inside a `useEffect` callback (e.g., `useEffect(() => { useFactory(...) })`)
- **THEN** `pnpm lint` exits non-zero with a `react-hooks/rules-of-hooks` error

#### Scenario: rules-of-hooks blocks a hook call inside Array.map placed inside a non-hook scope

- **WHEN** SPA editor source contains a hook call inside `Array.prototype.map` whose enclosing context is NOT a React function-component or custom-hook body — e.g., `useEffect(() => { items.map((useFooBar) => useFooBar()); }, [])` placed inside an effect body
- **THEN** `pnpm lint` exits non-zero with a `react-hooks/rules-of-hooks` error (the plugin detects the call by the `use*` identifier prefix; this scenario covers the plugin's _scope_ detection, while the misnamed-parameter case is covered by the separate "Hook-collection map parameter naming guard" requirement)

#### Scenario: Plugin is loaded by the SPA files block of eslint.config.js

- **WHEN** the resolved ESLint configuration is inspected via `pnpm exec eslint --print-config packages/workout-spa-editor/src/main.tsx | jq '.plugins | keys'`
- **THEN** the output array contains `"react-hooks"`, and the resolved `rules` object contains both `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` at level `"error"`

### Requirement: Hook-collection map parameter naming guard

A static-source guard `scripts/check-hook-collection-map-naming.mjs` SHALL run in CI under `pnpm test:scripts` and fail when any `*.{ts,tsx}` file under `packages/workout-spa-editor/src/**` contains an `Array.prototype.map` call whose callback is an arrow-function matching the following single trigger pattern (combining two syntactic conditions):

- the callback body invokes the parameter as a function (i.e., `<param>(...)` appears syntactically inside the body), AND
- the parameter name does NOT start with `use` (case-sensitive prefix — `update`, `unused`, etc. are NOT accepted; only the literal `use` prefix passes).

The trigger pattern depends only on the callback's syntactic shape, not on receiver identity (`factories`, `useCoachingSourceFactories()`, or any other expression are all in scope). Whether the receiver is `factories`, `useCoachingSourceFactories()`, or any other expression is irrelevant — any callable callback parameter is a potential hook call site, and naming it with the `use*` prefix is what allows `react-hooks/rules-of-hooks` to detect rule violations downstream. This rule exists because that plugin detects hook calls **by identifier prefix** — a parameter named `f` or `factory` is silently accepted even when it points to a real React hook. The naming guard closes the gap so the lint plugin can do its job.

The guard scopes itself to the full SPA `src/**` tree (broader than the PII guard's `{components,hooks,lib}/**` scope) because Rules-of-Hooks applies everywhere, not just to user-facing-string call sites.

The script SHALL have a co-located unit test (`scripts/check-hook-collection-map-naming.test.mjs`) covering at least:

- A positive case (compliant `factories.map((useFactory) => useFactory(...))` passes).
- A negative case (`factories.map((f) => f(...))` fails with a clear message naming the file, line, and bad parameter).
- A negative case for a non-`use*` prefix that still has a `u` prefix (e.g., `update`, `unused`) to verify the check is strict on the `use` prefix and not just the letter `u`.
- A no-op case (a `.map` whose callback body does NOT invoke the parameter as a function — e.g., `.map((x) => x.id)` — passes regardless of name).
- A non-receiver-bound case: `[fn1, fn2].map((g) => g())` MUST fail (callback parameter is invoked, name does not start with `use`); `[1, 2, 3].map((n) => n + 1)` MUST pass (parameter not invoked as a function).

#### Scenario: Misnamed parameter fails the guard

- **WHEN** `packages/workout-spa-editor/src/components/SomeComponent.tsx` contains `factories.map((f) => f(profileId, days))`
- **THEN** `pnpm test:scripts` exits non-zero with a message naming the file, line number, and the rejected parameter `f`

#### Scenario: Compliant parameter passes the guard

- **WHEN** `packages/workout-spa-editor/src/hooks/use-coaching-activities.ts` contains `factories.map((useFactory) => useFactory(activeProfileId, days))`
- **THEN** `pnpm test:scripts` does not flag this site

#### Scenario: Non-invoking map call is exempt

- **WHEN** a file contains `factories.map((f) => f.id)` (parameter is destructured, not invoked as a function)
- **THEN** the guard does not flag this site

### Requirement: Registry-bootstrap smoke-render test

For each SPA editor component that **directly** consumes `useCoachingSourceFactories` (or any future analogous registry of factory hooks), the SPA test suite SHALL include at least one "smoke-render" test that:

- Imports and uses the **real** registry bootstrap (e.g., `CoachingRegistryBootstrap` from `coaching-registry-bootstrap.tsx`) — NOT a mock of `useCoachingSourceFactories`.
- Imports and uses the **real** factories that the production bootstrap registers, so every factory's hook composition runs in the test environment.
- Provides every required runtime context the bootstrap and its factories transitively need (today, at minimum: `PersistenceProvider` with `createInMemoryPersistence()`).
- Mounts the component AND co-mounts a `TestProbe` that calls `useCoachingActivities(["YYYY-MM-DD"])` (or whatever hook materializes the factories at runtime) inside the same provider tree. This forces every registered factory hook to actually execute in the test, so a Rules-of-Hooks regression introduced INSIDE a factory body (not just at the dialog boundary) is caught at `pnpm -r test`. Without the probe, the dialog's post-fix decoupling from the registry would render the smoke test diagnostically inert for factory-internal regressions.
- Asserts that rendering does not throw and the component is present in the DOM. Because the dialog is rendered into a body-level Radix portal, the assertion MUST target either the testid (`coaching-activity-dialog`) via `screen.getByTestId(...)` or `document.body`, NOT the test render's local `container`.
- Additionally asserts the bootstrap registered at least one factory (non-vacuous registration). Today, this means asserting `useCoachingActivities(["YYYY-MM-DD"]).syncSources.length >= 1` (or a sentinel-factory check). Without this assertion, a regression that empties the bootstrap's factory list would pass the smoke test trivially.

The in-scope component set today is exactly `{ CoachingActivityDialog }`. Any component ADDED in the future that directly consumes `useCoachingSourceFactories` SHALL ship with its own smoke-render test in the same PR.

The purpose of this requirement is to make Rules-of-Hooks regressions and registry-composition failures surface at `pnpm -r test`, not at runtime in the user's browser. Mocking `useCoachingSourceFactories` (or the registry context) is permitted in **other** tests for that component — but at least one smoke-render test per registry-consuming component MUST exercise the real bootstrap.

#### Scenario: CoachingActivityDialog has a bootstrap-real smoke test

- **WHEN** the SPA test suite runs `pnpm test` in `packages/workout-spa-editor`
- **THEN** at least one test mounts `CoachingActivityDialog` through the real `CoachingRegistryBootstrap` (with no `vi.mock` on `coaching-registry-context`) and asserts the render does not throw and the dialog DOM (queried via `screen.getByTestId("coaching-activity-dialog")`) is present

#### Scenario: Bootstrap-real smoke test catches a hook regression in factory internals

- **GIVEN** a developer introduces a hook call inside a `useEffect` or inside `Array.map` in `useTrain2GoSource` (or any other factory registered by `CoachingRegistryBootstrap`)
- **WHEN** `pnpm test` runs
- **THEN** the smoke-render test fails because the `TestProbe` invokes `useCoachingActivities(["YYYY-MM-DD"])` inside the same provider tree, which transitively calls every factory at hook top-level — the Rules-of-Hooks violation surfaces as React error #321 at render time, before merge

#### Scenario: no-restricted-imports rejects re-coupling of the dialog to the registry at lint time

- **GIVEN** a developer re-imports `useCoachingSourceFactories` (or any other registry-context export) into one of the three dialog files in violation of the rule from "Dialog must not import the coaching-source registry"
- **WHEN** `pnpm lint` runs
- **THEN** the regression is caught at lint time with a `no-restricted-imports` error before any test runs

#### Scenario: Smoke test catches an emptied bootstrap factory list

- **GIVEN** a regression where `CoachingRegistryBootstrap` registers an empty factory list (e.g., the `useTrain2GoSource` registration is accidentally removed)
- **WHEN** `pnpm test` runs the bootstrap smoke test
- **THEN** the test fails because the non-vacuous-registration assertion (factories ≥ 1) is violated, even though render-time would otherwise pass cleanly

### Requirement: Dialog must not import the coaching-source registry

Files matching `packages/workout-spa-editor/src/components/molecules/CoachingCard/{CoachingActivityDialog,CoachingActivityDialogContent,use-coaching-dialog}.{ts,tsx}` MUST NOT import any symbol from `../../contexts/coaching-registry-context*` or from `../../types/coaching-source*` (other than the `CoachingActivity` type which is the data shape they consume). This is enforced by `no-restricted-imports` (or `@typescript-eslint/no-restricted-imports`) in `eslint.config.js`, scoped to the dialog files.

This rule is the static expression of the architectural invariant from D1 of this change's design: the dialog is a leaf consumer of an opaque `expandActivity` callback, and the registry is materialized exactly once per render tree by the dialog's mounting host (the calendar via `useCoachingActivities`).

#### Scenario: Importing the registry context from the dialog files is rejected

- **WHEN** any of the three dialog source files attempts `import { useCoachingSourceFactories } from "../../contexts/coaching-registry-context"`
- **THEN** `pnpm lint` exits non-zero with a `no-restricted-imports` error naming the forbidden import path

#### Scenario: Importing the CoachingActivity type from the dialog files is allowed

- **WHEN** the dialog imports `import type { CoachingActivity } from "../../types/coaching-activity"`
- **THEN** `pnpm lint` passes (the rejection list excludes data-shape types and only restricts registry / source-port modules)

### Requirement: analytics.event first-argument hygiene

The static-source guard `scripts/check-no-pii-leakage.mjs` SHALL be extended to recognize a fourth dispatch shape: `analytics.event(<eventName>, <payload>)` (and its destructured / re-bound equivalents) anywhere under `packages/workout-spa-editor/src/{components,hooks,lib}/**`. The first argument (`<eventName>`) MUST satisfy the same shape rule already enforced for `toast.*` and `console.*`: bare string literal, OR bare top-level `SCREAMING_SNAKE_CASE` identifier whose value is directly a bare string literal.

This rule extends the existing PII guard from user-facing string sinks (toast, console) to a third-party telemetry sink (analytics). The motivation is identical: structurally forbid interpolation so user-typed content cannot leak via event names. The payload object passed as the second argument is OUT of scope for this rule — payload-level PII is governed by the per-event spec (e.g., the `route-error` payload's `scrubAnalyticsString` requirement under `analytics-port`).

#### Scenario: analytics.event with template-literal first arg is rejected

- **WHEN** any covered file contains `analytics.event(\`workout-${id}-saved\`, {})`
- **THEN** `pnpm test:scripts` exits non-zero with a clear message naming the file, line, and the rejected interpolation form

#### Scenario: analytics.event with bare string literal passes

- **WHEN** any covered file contains `analytics.event("workout-saved", { id })`
- **THEN** `pnpm test:scripts` passes (the second-argument payload is governed by per-event specs, not this guard)

#### Scenario: Destructured analytics.event is covered

- **WHEN** a file contains `const { event } = useAnalytics(); event(\`x-${y}\`, {});`
- **THEN** `pnpm test:scripts` exits non-zero (the destructure tracking already implemented for `toast` and `console` MUST cover `analytics` too)

