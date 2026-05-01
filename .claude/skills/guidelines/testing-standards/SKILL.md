---
name: testing-standards
description: Read this guideline when writing tests, reviewing test code, or deciding what kind of test to write for a given layer. Also applies when files match **/*.test.{ts,tsx,js,mjs}.
---

# Testing Standards — Kaiord

## AAA pattern

Every test uses Arrange / Act / Assert with a blank line between each section:

```typescript
it("converts power zone to explicit watts", () => {
  // Arrange
  const step = buildWorkoutStep({ target: { type: "power", zone: 3 } });

  // Act
  const result = toGcnStep(step);

  // Assert
  expect(result.targetValueOne).toBe(195);
  expect(result.targetValueTwo).toBe(230);
});
```

## Per-layer test strategy

| Layer                                   | Test type   | Dependencies                   | Notes                                       |
| --------------------------------------- | ----------- | ------------------------------ | ------------------------------------------- |
| Domain (schemas, types, pure functions) | Unit        | None                           | No mocks                                    |
| Application (use cases)                 | Unit        | Port stubs/mocks               | No real adapters                            |
| Adapters                                | Integration | FIT SDK, parser, real fixtures | Use `@kaiord/core/test-utils`               |
| Round-trip (FIT ↔ KRD ↔ TCX)            | Integration | Full pipeline                  | Within tolerances in `krd-format` guideline |
| CLI                                     | Integration | Spawns child process           | Timeout ≥ 15 000 ms                         |

## Coverage thresholds

| Scope                           | Threshold |
| ------------------------------- | --------- |
| `@kaiord/core`                  | 80%       |
| Frontend (`workout-spa-editor`) | 70%       |

## Mappers vs converters

- `*.mapper.ts` — MUST NOT have tests (simple transform, no logic)
- `*.converter.ts` — MUST have tests
- Exception: if a `*.mapper.ts` grows non-trivial logic (validation, branching, side effects, anything beyond pure field-to-field transformation), refactor it to `*.converter.ts` and add tests.

## Fixture imports

Always import fixtures from `@kaiord/core/test-utils`. Never re-implement fixture loading.

## Never skip a test

Never skip a test unconditionally. If a test fails, fix the code or update the test to reflect a deliberate behavior change — never silence it. The acceptable forms of skipping are:

1. A runtime-evaluated `*.skipIf(<expr>)` whose argument depends on the environment (e.g., `process.env.X`, `typeof window !== "undefined"`).
2. A `*.todo(...)` call with an immediately-preceding `// TODO(YYYY-MM-DD): reason` comment whose deadline is not yet expired (Vitest's planned-test convention with a hard deadline). When the deadline passes, CI fails until the test is implemented or the deadline is extended via PR.

Enforcement: `scripts/check-no-unconditional-skip.mjs` (R-NoUnconditionalSkip).

The check covers four dispatch shapes mechanically:

1. **Member**: `it.skip("...", fn)` / `test.only(...)` / `describe.todo(...)`.
2. **Computed-member**: `it["skip"]("...", fn)`, `test["only"](...)`, `describe["todo"](...)`.
3. **Destructured**: `const { skip } = it; skip("...", fn);` and renames `const { only: myOnly } = test;` (depth-1).
4. **Re-bound**: `const my = it; my.skip("...", fn);` (depth-1).

Chain re-binds (e.g., `const my = it; const { skip } = my; skip(...)`) remain documented residual risk — vanishingly rare in practice and not depth-1.

The conditional `it.skipIf(<expr>)` form is allowed only when `<expr>` contains at least one `Identifier`, `MemberExpression`, `CallExpression`, or `NewExpression` node — literal-only arguments (e.g., `skipIf(true)`, `skipIf(!!1)`, ``skipIf(`true`)``) are rejected as functionally equivalent to unconditional skip. The same literal-only rejection applies to `skipIf` accessed through destructured or re-bound aliases.

The `*.todo` deadline allowance is recognized only when the comment is on the line **immediately above** the call (no blank line between). The date format is strictly `YYYY-MM-DD`. Once the deadline passes, the rule fails CI with the exact expired date in the message.

## Test output capture

```bash
set -o pipefail
pnpm test 2>&1 | tee /tmp/out.txt
```

`pipefail` preserves the test runner's real exit code through the `tee` pipe — without it the pipeline always exits 0 and CI/local scripts treat broken tests as success. Always capture both stdout and stderr when diagnosing issues; using `| tail` alone hides stderr warnings.
