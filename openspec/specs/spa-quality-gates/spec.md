> Synced: 2026-05-01 (cleanup-open-issues-may-2026)

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
