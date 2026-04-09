---
title: "Testing Guide"
description: "Testing practices for Kaiord: TDD workflow, AAA pattern, round-trip tests, fixture management, and coverage requirements."
---

# Testing Guide

Kaiord uses a comprehensive testing strategy with multiple test types.

## Test types

- **Unit tests** -- individual functions and components
- **Integration tests** -- how components work together
- **Round-trip tests** -- data integrity through format conversions
- **E2E tests** -- complete user workflows
- **Property-based tests** -- universal properties across many inputs

## Test stack

| Package        | Runner         | Coverage target             |
| -------------- | -------------- | --------------------------- |
| `@kaiord/core` | Vitest         | 80% overall, 90% converters |
| `@kaiord/fit`  | Vitest         | 80%                         |
| `@kaiord/tcx`  | Vitest         | 80%                         |
| `@kaiord/zwo`  | Vitest         | 80%                         |
| Frontend SPA   | Vitest + jsdom | 70%                         |

## TDD workflow

Every task follows Test-Driven Development:

1. **Write the test first** -- before implementing
2. **Run the test** -- verify it fails (red)
3. **Write minimal code** -- make the test pass (green)
4. **Refactor** -- improve code while keeping tests green
5. **Commit** -- each task is a functional commit

## AAA pattern

All tests use Arrange-Act-Assert with clear sections:

```typescript
it("should convert FIT buffer to KRD", async () => {
  // Arrange
  const fitBuffer = new Uint8Array([1, 2, 3, 4]);
  const mockReader = vi.fn().mockResolvedValue(buildKRD.build());

  // Act
  const result = await fromBinary(fitBuffer, mockReader);

  // Assert
  expect(result).toStrictEqual(mockReader.mock.results[0].value);
});
```

## Test organization

Tests are co-located with source code:

```
src/
├── domain/
│   └── validation/
│       ├── schema-validator.ts
│       └── schema-validator.test.ts
├── adapters/
│   └── fit/
│       ├── garmin-fitsdk.ts
│       └── garmin-fitsdk.test.ts
└── application/
    └── use-cases/
        ├── convert-fit-to-krd.ts
        └── convert-fit-to-krd.test.ts
```

## Mappers vs converters

**Mappers** (`*.mapper.ts`) -- simple data transformation, no logic. Do **not** test directly.

**Converters** (`*.converter.ts`) -- business logic, calculations. **Must** test with 90%+ coverage.

## Round-trip tests

Validate data integrity through conversions (FIT to KRD to FIT):

**Tolerances**:

- Time: +/- 1 second
- Power: +/- 1 watt or +/- 1% FTP
- Heart rate: +/- 1 bpm
- Cadence: +/- 1 rpm

```typescript
it("should preserve data in FIT round-trip", async () => {
  // Arrange
  const originalKrd = buildKRD.build();

  // Act
  const fitBuffer = await convertKrdToFit(originalKrd);
  const roundTripKrd = await convertFitToKrd(fitBuffer);

  // Assert
  expect(roundTripKrd).toMatchKrdWithTolerance(originalKrd, {
    time: 1,
    power: 1,
    heartRate: 1,
    cadence: 1,
  });
});
```

## Fixture management

Use Faker for realistic data, Rosie for factories:

```typescript
import { faker } from "@faker-js/faker";
import { Factory } from "rosie";

export const buildEntity = new Factory<EntityType>()
  .attr("id", () => faker.string.uuid())
  .attr("name", () => faker.lorem.word());
```

Rules:

- Fixtures generate data, tests validate
- Do not call `.parse()` in fixtures
- Keep fixtures simple

## What to test and what not to test

**Test**: converters, validators, use cases, error handling, edge cases, round-trips.

**Do not test**: types, mappers, fixtures, type definitions, third-party libraries.

## Running tests

```bash
# All tests
pnpm -r test

# Single package
cd packages/core && pnpm test

# Watch mode
pnpm -r test:watch

# With coverage
pnpm test -- --coverage
```

## Next steps

- [Architecture](/guide/architecture) -- how layers are tested in isolation
- [Quick Start](/guide/quick-start) -- build something to test
