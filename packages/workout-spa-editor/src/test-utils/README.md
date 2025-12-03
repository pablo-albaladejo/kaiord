# Test Utilities

This directory contains shared test utilities for the Workout SPA Editor.

## Console Spy Utilities

The console spy utilities help detect React warnings during tests, particularly "React does not recognize" prop warnings that occur when component-specific props are incorrectly passed to DOM elements.

### Quick Start

```typescript
import { expectNoReactWarnings } from "@/test-utils";

it("should render without React warnings", () => {
  // Arrange
  const warningChecker = expectNoReactWarnings();

  // Act
  render(<MyComponent {...props} />);

  // Assert
  warningChecker.verify();
});
```

### Available Functions

#### `expectNoReactWarnings()`

Creates a console spy that can detect React warnings. Returns an object with a `verify()` method.

**Usage:**

```typescript
const warningChecker = expectNoReactWarnings();
render(<MyComponent />);
warningChecker.verify(); // Throws if React warnings found
```

#### `setupConsoleErrorSpy()`

Sets up a spy on `console.error` for manual control in test suites.

**Usage:**

```typescript
describe("MyComponent", () => {
  let consoleSpy: ReturnType<typeof setupConsoleErrorSpy>;

  beforeEach(() => {
    consoleSpy = setupConsoleErrorSpy();
  });

  afterEach(() => {
    cleanupConsoleErrorSpy(consoleSpy);
  });

  it("should not log errors", () => {
    render(<MyComponent />);
    expectNoConsoleErrors(consoleSpy);
  });
});
```

#### `expectNoReactPropWarnings(consoleSpy, propNames?)`

Checks for specific React prop warnings.

**Usage:**

```typescript
// Check for any React prop warnings
expectNoReactPropWarnings(consoleSpy);

// Check for specific prop warnings
expectNoReactPropWarnings(consoleSpy, ["onStepSelect", "selectedStepId"]);
```

#### `expectNoConsoleErrors(consoleSpy)`

Verifies that no console errors were logged during the test.

**Usage:**

```typescript
render(<MyComponent />);
expectNoConsoleErrors(consoleSpy);
```

### When to Use

Use these utilities when:

- Testing components that spread props onto DOM elements
- Verifying that component-specific props are not passed to DOM
- Ensuring HTML attributes (data-\*, aria-\*) are correctly forwarded
- Refactoring prop handling to fix React warnings

### Examples

See `console-spy.example.test.tsx` for complete usage examples.

## Fixture Utilities

Re-exports fixture utilities from `@kaiord/core` for loading test data.

### Available Functions

- `loadKrdFixture(name)` - Load a KRD fixture by name
- `loadKrdFixtureRaw(name)` - Load raw KRD JSON string
- `getFixturePath(name)` - Get path to fixture file
- `loadFixturePair(name)` - Load both KRD and original format
- `FIXTURE_NAMES` - Available fixture names

**Usage:**

```typescript
import { loadKrdFixture } from "@/test-utils";

const krd = loadKrdFixture("WorkoutIndividualSteps");
```

## Best Practices

1. **Use `expectNoReactWarnings()` for simple cases** - It's the easiest API
2. **Use manual spy setup for complex test suites** - When you need more control
3. **Always verify after rendering** - Call `verify()` after all render operations
4. **Test both valid and invalid scenarios** - Ensure HTML attributes still work
5. **Keep tests focused** - One assertion per test when possible

## References

- [React: Unknown Prop Warning](https://reactjs.org/warnings/unknown-prop.html)
- [Vitest: Mocking](https://vitest.dev/guide/mocking.html)
- [Testing Library: Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
