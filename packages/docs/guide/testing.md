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

## Test assertions

- Use `toStrictEqual()` for objects -- validates complete structure
- Use fixtures with `.build()` -- generate realistic data
- Include all fields in assertions
- One `expect` per object, not per property

```typescript
// Good -- complete object validation
expect(metadata).toStrictEqual({
  created: "2025-01-15T10:30:00Z",
  manufacturer: metadata.manufacturer,
  sport: "running",
  subSport: metadata.subSport,
});

// Avoid -- multiple expects for same object
expect(metadata.created).toBe("2025-01-15T10:30:00Z");
expect(metadata.sport).toBe("running");
```

## Coverage strategy

Mappers get coverage indirectly through:

1. **Integration tests** -- testing adapters that use mappers
2. **Round-trip tests** -- FIT to KRD to FIT conversions
3. **Converter tests** -- converters that call mappers
4. **Use case tests** -- end-to-end flows

If a mapper has low coverage, it means the mapper is unused, has logic that should be in a converter, or is missing integration test scenarios.

## Frontend testing

### Component tests (React Testing Library)

```typescript
describe("Button", () => {
  it("should call onClick when clicked", async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

    // Act
    await user.click(screen.getByRole("button"));

    // Assert
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

Use semantic queries in this order: `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByTestId` (last resort).

### Store tests (Zustand)

Reset state before each test:

```typescript
beforeEach(() => {
  useWorkoutStore.setState({
    currentWorkout: null,
    workoutHistory: [],
    historyIndex: -1,
  });
});
```

### E2E tests (Playwright)

```typescript
test("should load and edit workout", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /load workout/i }).click();
  await page.getByRole("textbox", { name: /workout name/i }).fill("New Name");
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
});
```

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

# E2E tests (frontend)
cd packages/workout-spa-editor && pnpm test:e2e
```

## Best practices

**Do**: test user behavior, use semantic queries, test accessibility, test error states, follow AAA pattern, use fixtures.

**Don't**: test implementation details, test types (TypeScript handles this), test mappers directly, test third-party libraries, use `getByTestId` as first choice.

## Next steps

- [Architecture](/guide/architecture) -- how layers are tested in isolation
- [Quick Start](/guide/quick-start) -- build something to test
