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

Never skip a test unconditionally. If a test fails, fix the code or update the test to reflect a deliberate behavior change — never silence it. The only acceptable form of skipping is a runtime-evaluated `*.skipIf(<expr>)` whose argument depends on the environment (e.g., `process.env.X`, `typeof window !== "undefined"`).

Enforcement: `scripts/check-no-unconditional-skip.mjs` (R-NoUnconditionalSkip).

The rule covers four dispatch shapes: member (`it.skip("...", fn)`), computed-member (`it["skip"]("...", fn)`), destructured (`const { skip } = it; skip("...", fn)`), and re-bound (`const my = it; my.skip("...", fn)`). The conditional `it.skipIf(<expr>)` form is allowed only when `<expr>` contains at least one `Identifier`, `MemberExpression`, `CallExpression`, or `NewExpression` node — literal-only arguments (e.g., `skipIf(true)`, `skipIf(!!1)`, `` skipIf(`true`) ``) are rejected as functionally equivalent to unconditional skip.

## Test output capture

```bash
set -o pipefail
pnpm test 2>&1 | tee /tmp/out.txt
```

`pipefail` preserves the test runner's real exit code through the `tee` pipe — without it the pipeline always exits 0 and CI/local scripts treat broken tests as success. Always capture both stdout and stderr when diagnosing issues; using `| tail` alone hides stderr warnings.
