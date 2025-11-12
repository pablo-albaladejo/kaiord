# Test-Driven Development (TDD)

## TDD Workflow

Every task MUST follow Test-Driven Development:

1. **Write the test first** - Before implementing any functionality
2. **Run the test** - Verify it fails (red)
3. **Write minimal code** - Make the test pass (green)
4. **Refactor** - Improve code while keeping tests green
5. **Commit** - Each task should be a functional commit

## Test Structure

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

### Test Framework

- **Vitest** as testing framework
- Import only: `describe`, `expect`, `it`, `vi`
- Use `vi.fn()` for mocks with proper typing
- Prefer `toStrictEqual` over `toEqual`

## Fixture Management

### Faker + Rosie Pattern

Use faker for realistic data generation and rosie for factories:

```typescript
import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { EntityType } from "../domain/types/entity";

export const buildEntity = new Factory<EntityType>()
  .attr("id", () => faker.string.uuid())
  .attr("name", () => faker.lorem.word({ length: { max: 64, min: 1 } }))
  .attr("createdAt", () => faker.date.recent().toISOString());
```

### Fixture Organization

```
tests/
├── fixtures/
│   ├── krd.fixtures.ts           # KRD document fixtures
│   ├── workout.fixtures.ts       # Workout domain fixtures
│   ├── duration.fixtures.ts      # Duration fixtures
│   └── target.fixtures.ts        # Target fixtures
└── unit/
    ├── domain/
    ├── adapters/
    └── application/
```

### Faker Best Practices

```typescript
// ✅ Good - Realistic constraints
.attr('shortName', () => faker.lorem.word({ length: { max: 32, min: 1 } }))
.attr('count', () => faker.number.int({ max: 100, min: 0 }))
.attr('percentage', () => faker.number.float({ max: 100, min: 0, fractionDigits: 2 }))

// ❌ Bad - Hardcoded values
.attr('name', () => 'test-name')
.attr('count', () => 42)
```

## What to Test vs What to Mock

### Pure Functions: NO MOCKS

Pure functions should be tested directly, never mocked:

- Data transformers
- Validators
- Formatters
- Mappers
- Calculators

```typescript
// ✅ Good - Test real pure function
import { convertFitToKrd } from "./converter";

const result = convertFitToKrd(fitData);
expect(result).toStrictEqual(expectedKrd);

// ❌ Bad - Mocking pure function
vi.mock("./converter", () => ({
  convertFitToKrd: vi.fn(() => mockKrd),
}));
```

### Non-Pure Functions: MOCK THESE

- Database calls
- HTTP requests
- File system operations
- External service calls
- Date/time functions (when testing time-sensitive logic)

```typescript
// ✅ Good - Mock external dependency
const mockFitReader = vi.fn<FitReader>();
mockFitReader.mockResolvedValue(expectedKrd);
```

## Test Coverage Requirements

### Comprehensive Scenarios

Every function must test:

1. **Happy path** - Normal successful execution
2. **Edge cases** - Boundary conditions, empty inputs
3. **Error conditions** - Invalid inputs, undefined values
4. **Type conversions** - Proper type handling
5. **Data preservation** - Exact input/output mapping

### Coverage Targets

- Overall: ≥ 80%
- Mappers/converters: ≥ 90%
- Domain logic: 100%

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

## Test Organization

### File Naming

- Co-locate with source: `converter.ts` → `converter.test.ts`
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

Commits should be atomic and functional - the codebase should work after each commit. Each commit contains both the test and the implementation that makes it pass.

## Anti-Patterns to Avoid

### Don't Hardcode Test Data

```typescript
// ❌ Bad
const krd = {
  version: "1.0",
  type: "workout",
  metadata: { created: "2024-01-01T00:00:00Z", sport: "cycling" },
};

// ✅ Good
const krd = buildKrd.build({
  type: "workout",
  metadata: buildMetadata.build({ sport: "cycling" }),
});
```

### Don't Test Implementation Details

```typescript
// ❌ Bad - Testing how it works
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);

// ✅ Good - Testing what it does
expect(result).toStrictEqual(expectedOutput);
```

### Don't Mock Pure Functions

```typescript
// ❌ Bad
vi.mock("./converter", () => ({
  toKRD: vi.fn(() => mockKrd),
}));

// ✅ Good
import { toKRD } from "./converter";
const result = toKRD(fitData);
```

## Summary

- **Test first** - Write tests before implementation
- **AAA pattern** - Arrange, Act, Assert with clear sections
- **Faker + Rosie** - Realistic test data with factories
- **No mocks for pure functions** - Test real implementations
- **Functional commits** - Each task is a working commit
- **Type inference** - Let TypeScript infer types
- **Focus on behavior** - Test what, not how
