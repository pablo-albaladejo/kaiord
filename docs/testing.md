# Testing Guide

This guide covers testing practices for the Kaiord project, including the core library and frontend SPA editor.

## Overview

Kaiord uses a comprehensive testing strategy with multiple test types:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test how components work together
- **Round-Trip Tests**: Validate data integrity through format conversions
- **E2E Tests**: Validate complete user workflows
- **Property-Based Tests**: Test universal properties across many inputs

## Test Stack

### Core Package (@kaiord/core)

- **Test Runner**: Vitest
- **Fixtures**: Faker + Rosie factories
- **Coverage Target**: ≥ 80% overall, ≥ 90% for converters

### Frontend Package (workout-spa-editor)

- **Test Runner**: Vitest with jsdom
- **Component Testing**: React Testing Library
- **User Interactions**: @testing-library/user-event
- **DOM Matchers**: @testing-library/jest-dom
- **E2E Testing**: Playwright
- **Coverage Target**: ≥ 70% overall

## Test-Driven Development (TDD)

Every task MUST follow Test-Driven Development:

1. **Write the test first** - Before implementing any functionality
2. **Run the test** - Verify it fails (red)
3. **Write minimal code** - Make the test pass (green)
4. **Refactor** - Improve code while keeping tests green
5. **Commit** - Each task should be a functional commit

### AAA Pattern (Arrange-Act-Assert)

All tests MUST follow the AAA pattern with clear sections:

```typescript
it("should describe what the test does", () => {
  // Arrange
  const input = buildFixture.build({ specificProperty: "value" });
  const expected = { result: "expected" };

  // Act
  const result = functionUnderTest(input);

  // Assert
  expect(result).toStrictEqual(expected);
});
```

## Core Package Testing

### Test Organization

**Co-located tests**: Tests live next to the code they test

```
src/
├── domain/
│   ├── types/
│   │   └── krd.ts                # NO test file - types validated by TypeScript
│   └── validation/
│       ├── schema-validator.ts
│       └── schema-validator.test.ts  # Test logic, not types
├── adapters/
│   └── fit/
│       ├── garmin-fitsdk.ts
│       └── garmin-fitsdk.test.ts     # Test conversion logic
└── application/
    └── use-cases/
        ├── convert-fit-to-krd.ts
        └── convert-fit-to-krd.test.ts # Test use case logic
```

**All fixtures** in `src/tests/` directory:

```
src/
├── tests/
│   ├── fixtures/
│   │   ├── krd.fixtures.ts       # KRD fixtures
│   │   ├── metadata.fixtures.ts  # Metadata fixtures
│   │   ├── workout.fixtures.ts   # Workout fixtures
│   │   └── fit-files/            # Binary FIT test files
│   │       ├── WorkoutIndividualSteps.fit
│   │       └── WorkoutRepeatSteps.fit
│   └── helpers/
│       └── test-utils.ts         # Test utilities (mock logger, etc.)
```

### Mappers vs Converters

#### Mappers (\*.mapper.ts)

**Definition**: Simple data transformation functions with NO business logic

- Direct field mapping (e.g., `camelCase` → `snake_case`)
- Enum lookups from static maps
- Simple validation with `.safeParse()` and default fallback
- Delegating to converters for complex logic

**Testing**: ❌ **DO NOT test mappers directly**

- Mappers have no logic to test
- Coverage comes from integration tests, round-trip tests, and converter tests
- If you find yourself writing a test for a mapper, the mapper has too much logic

```typescript
// ✅ Good mapper - No test needed
export const mapSubSportToKrd = (fitSubSport: unknown): SubSport => {
  const result = fitSubSportSchema.safeParse(fitSubSport);
  if (!result.success) return subSportSchema.enum.generic;
  return FIT_TO_KRD_MAP[result.data] || subSportSchema.enum.generic;
};

// ❌ Bad mapper - Has logic, should be a converter
export const mapDuration = (step: FitWorkoutStep): Duration => {
  if (step.durationType === "time") {
    return { type: "time", seconds: step.durationValue * 1000 }; // Logic!
  }
  // ... more logic
};
```

#### Converters (\*.converter.ts)

**Definition**: Functions with business logic, calculations, or complex transformations

- Mathematical calculations (unit conversions, offsets)
- Conditional logic based on multiple fields
- Data validation with error handling
- Complex object construction

**Testing**: ✅ **MUST test converters**

- Test all logic paths
- Test edge cases and boundary conditions
- Coverage target: ≥ 90%

```typescript
// ✅ Converter with logic - MUST have tests
export const convertPowerTarget = (step: WorkoutStep): FitTarget => {
  if (step.target.value.unit === "watts") {
    return { targetValue: step.target.value.value + 1000 }; // Garmin offset
  }
  if (step.target.value.unit === "percent_ftp") {
    return { targetValue: step.target.value.value }; // No offset
  }
  // ... more logic
};
```

### What NOT to Test

- **DO NOT test types** - TypeScript validates types at compile time
- **DO NOT test fixtures** - Fixtures are test utilities, not production code
- **DO NOT test type definitions** - If it compiles, the types are correct
- **DO NOT test that objects match their type** - This is what TypeScript does
- **DO NOT test mappers** - Simple data transformation with no logic

### What TO Test

- **Business logic** - Converters (with logic), validators, transformations
- **Edge cases** - Boundary conditions, empty inputs, invalid data
- **Integration** - How components work together (includes mapper coverage)
- **Round-trip conversions** - Data integrity through format conversions
- **Error handling** - How code responds to failures

### Fixture Management

Use Faker for realistic data generation and Rosie for factories:

```typescript
import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { EntityType } from "../domain/types/entity";

export const buildEntity = new Factory<EntityType>()
  .attr("id", () => faker.string.uuid())
  .attr("name", () => faker.lorem.word({ length: { max: 64, min: 1 } }))
  .attr("createdAt", () => faker.date.recent().toISOString());
```

**Fixture Rules**:

- **DO NOT validate in fixtures** - Fixtures should NOT call `.parse()` or `.safeParse()` in `.after()` hooks
- **Fixtures generate data, tests validate** - Validation is the responsibility of tests
- **Keep fixtures simple** - Only generate realistic data using faker

### Test Assertions

- **Use `toStrictEqual()` for objects** - Validates complete object structure
- **Use fixtures with `.build()`** - Generate realistic test data
- **Include all fields in assertions** - Specify all fields (use `obj.field` for generated values)
- **One `expect` per object** - Validate entire objects, not individual properties

```typescript
// ✅ Good - Complete object validation
const metadata = buildKRDMetadata.build({
  created: "2025-01-15T10:30:00Z",
  sport: "running",
});

expect(metadata).toStrictEqual({
  created: "2025-01-15T10:30:00Z",
  manufacturer: metadata.manufacturer, // Generated by fixture
  product: metadata.product,
  serialNumber: metadata.serialNumber,
  sport: "running",
  subSport: metadata.subSport,
});

// ❌ Bad - Multiple expects for same object
expect(metadata.created).toBe("2025-01-15T10:30:00Z");
expect(metadata.sport).toBe("running");
```

### Round-Trip Tests

Round-trip tests validate data integrity through format conversions:

- **FIT ↔ KRD**: Convert FIT to KRD and back, verify data preservation
- **TCX ↔ KRD**: Convert TCX to KRD and back, verify data preservation
- **ZWO ↔ KRD**: Convert Zwift to KRD and back, verify data preservation

**Tolerances**:

- Time: ±1 second
- Power: ±1 watt or ±1% FTP
- Heart Rate: ±1 bpm
- Cadence: ±1 rpm

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

### Coverage Strategy

Mappers get coverage indirectly through:

1. **Integration tests** - Testing adapters that use mappers
2. **Round-trip tests** - FIT → KRD → FIT conversions
3. **Converter tests** - Converters that call mappers
4. **Use case tests** - End-to-end flows

If a mapper has low coverage after these tests, it means:

- The mapper is not being used (dead code)
- The mapper has logic that should be in a converter
- Missing integration/round-trip test scenarios

## Frontend Testing

### Component Testing

Test components using React Testing Library:

```typescript
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Button } from "./Button";

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

### Query Priorities

Use semantic queries in this order of preference:

1. **getByRole** - Most accessible (buttons, inputs, headings)
2. **getByLabelText** - Form fields with labels
3. **getByPlaceholderText** - Inputs with placeholders
4. **getByText** - Non-interactive text content
5. **getByTestId** - Last resort only

```typescript
// ✅ Preferred - Semantic queries
const button = screen.getByRole("button", { name: /submit/i });
const input = screen.getByLabelText("Workout Name");
const heading = screen.getByRole("heading", { name: "Create Workout" });

// ❌ Avoid - Test IDs (use only when necessary)
const element = screen.getByTestId("workout-form");
```

### Store Testing (Zustand)

Reset store state before each test:

```typescript
describe("useWorkoutStore", () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
    });
  });

  it("should load a workout into the store", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          steps: [],
        },
      },
    };

    // Act
    useWorkoutStore.getState().loadWorkout(mockKrd);
    const state = useWorkoutStore.getState();

    // Assert
    expect(state.currentWorkout).toEqual(mockKrd);
  });
});
```

### E2E Testing (Playwright)

E2E tests validate complete user workflows:

```typescript
test("should load and edit workout", async ({ page }) => {
  // Arrange
  await page.goto("/");

  // Act
  await page.getByRole("button", { name: /load workout/i }).click();
  await page.getByRole("textbox", { name: /workout name/i }).fill("New Name");
  await page.getByRole("button", { name: /save/i }).click();

  // Assert
  await expect(page.getByText("Workout saved")).toBeVisible();
});
```

**E2E Test Coverage**:

1. **Workout Load, Edit, and Save** - File loading and editing flow
2. **Workout Creation** - Create new workout from scratch
3. **Mobile Responsiveness** - Touch interactions and responsive layout
4. **Accessibility** - Keyboard navigation and ARIA compliance

### Coverage Requirements

- **Overall**: ≥ 70% (lines, functions, branches, statements)
- **Components**: ≥ 80% for atoms and molecules
- **Store**: ≥ 90% for state management
- **Utils**: ≥ 90% for utility functions

## Running Tests

### Core Package

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test schema-validator.test.ts
```

### Frontend Package

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test -- --coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui
```

## Best Practices

### ✅ DO

1. **Test user behavior** - Focus on what users see and do
2. **Use semantic queries** - Prefer `getByRole` over `getByTestId`
3. **Test accessibility** - Verify ARIA attributes and keyboard navigation
4. **Keep tests simple** - One assertion per test when possible
5. **Use descriptive test names** - Clearly state what is being tested
6. **Mock external dependencies** - API calls, timers, external services
7. **Test error states** - Validation errors, loading states, empty states
8. **Use `await` with user events** - All user interactions are async
9. **Follow AAA pattern** - Arrange, Act, Assert with clear sections
10. **Use fixtures** - Generate realistic test data with Faker + Rosie

### ❌ DON'T

1. **Don't test implementation details** - Test behavior, not internals
2. **Don't use `getByTestId` as first choice** - Use semantic queries
3. **Don't test third-party libraries** - Trust they work correctly
4. **Don't mock internal logic** - Only mock external dependencies
5. **Don't write brittle tests** - Avoid testing exact CSS classes
6. **Don't test types** - TypeScript handles type checking
7. **Don't forget to cleanup** - React Testing Library handles this automatically
8. **Don't use `act()` directly** - Use `waitFor()` or `await` user events
9. **Don't hardcode test data** - Use fixtures for realistic data
10. **Don't test mappers** - They have no logic to test

## Error Testing

### Only Test Error Handling, Not Propagation

```typescript
// ✅ Do test - Error is caught and transformed
const converter = async (input: unknown) => {
  try {
    return await parse(input);
  } catch (error) {
    throw createValidationError("Parse failed", error);
  }
};

// ❌ Don't test - Error bubbles up untouched
const reader = async (buffer: Uint8Array) => {
  return await decoder.read(buffer); // Errors propagate as-is
};
```

## TypeScript in Tests

### Leverage Type Inference

```typescript
// ✅ Good - Let TypeScript infer
const krd = buildKrd.build();

// ❌ Bad - Unnecessary annotation
const krd: KRD = buildKrd.build();
```

### Use `as const` Appropriately

```typescript
// ✅ Good - For union types
const duration = { type: "time" as const, seconds: 300 };

// ❌ Bad - In assertions
expect(result.type).toBe("time" as const);

// ✅ Good - Simple assertion
expect(result.type).toBe("time");
```

## Test Organization

### File Naming

- Co-locate with source: `converter.ts` → `converter.test.ts` (ONLY for logic files)
- **DO NOT** create test files for type definitions (`types/*.ts` should NOT have `.test.ts` files)
- Use descriptive test names
- Prefer `when` over `if` in test descriptions

```typescript
describe("convertFitToKrd", () => {
  it("should convert FIT workout when given valid buffer", () => {});
  it("should handle empty steps when workout has no intervals", () => {});
  it("should preserve target values when converting power zones", () => {});
});
```

### Test Grouping

```typescript
describe("FitReader", () => {
  describe("readToKRD", () => {
    it("should parse valid FIT file", () => {});
    it("should handle corrupted FIT file", () => {});
  });

  describe("convertMessages", () => {
    it("should convert workout messages", () => {});
    it("should convert step messages", () => {});
  });
});
```

## Commit Strategy

Each commit includes the complete TDD cycle:

1. **Write test** (red)
2. **Implement** (green)
3. **Refactor** (if needed)
4. **Commit** - One commit with test + implementation

Example commit message: `feat: add schema validator with tests`

Commits should be atomic and functional - the codebase should work after each commit.

## CI/CD Integration

Tests run automatically on:

- Every commit (pre-commit hook via Husky)
- Every push to remote
- Every pull request
- Before merging to main

**All tests must pass before code can be merged.**

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Documentation](https://playwright.dev/)
