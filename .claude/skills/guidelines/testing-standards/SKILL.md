---
name: testing-standards
description: Read this guideline when writing tests, reviewing test code, or deciding what kind of test to write for a given layer. Also applies when files match **/*.test.ts.
---

# Testing Standards — Kaiord

## AAA pattern

Every test uses Arrange / Act / Assert with a blank line between each section:

```typescript
it('converts power zone to explicit watts', () => {
  // Arrange
  const step = buildWorkoutStep({ target: { type: 'power', zone: 3 } });

  // Act
  const result = toGcnStep(step);

  // Assert
  expect(result.targetValueOne).toBe(195);
  expect(result.targetValueTwo).toBe(230);
});
```

## Per-layer test strategy

| Layer | Test type | Dependencies | Notes |
|-------|-----------|--------------|-------|
| Domain (schemas, types, pure functions) | Unit | None | No mocks |
| Application (use cases) | Unit | Port stubs/mocks | No real adapters |
| Adapters | Integration | FIT SDK, parser, real fixtures | Use `@kaiord/core/test-utils` |
| Round-trip (FIT ↔ KRD ↔ TCX) | Integration | Full pipeline | Within tolerances in `krd-format` guideline |
| CLI | Integration | Spawns child process | Timeout ≥ 15 000 ms |

## Coverage thresholds

| Scope | Threshold |
|-------|-----------|
| `@kaiord/core` | 80% |
| Frontend (`workout-spa-editor`) | 70% |

## Mappers vs converters

- `*.mapper.ts` — MUST NOT have tests (simple transform, no logic)
- `*.converter.ts` — MUST have tests

## Fixture imports

Always import fixtures from `@kaiord/core/test-utils`. Never re-implement fixture loading.

## Test output capture

```bash
pnpm test 2>&1 | tee /tmp/out.txt
```

Using `| tail` hides stderr warnings. Always capture both stdout and stderr when diagnosing issues.
