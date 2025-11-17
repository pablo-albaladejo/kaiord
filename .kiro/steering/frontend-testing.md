# Frontend Testing (React/Vitest)

Testing patterns and best practices for the Workout SPA Editor frontend application.

## Non-Negotiable Requirements

**EVERY component, page, and user flow MUST have tests:**

1. **100% Test Coverage Requirement**: Every component, page, hook, utility, and user flow MUST have corresponding test files
2. **Local Pre-commit**: All tests MUST pass locally via Husky pre-commit hooks before committing
3. **CI/CD Gate**: All tests MUST pass in CI/CD pipeline before merging to main/develop
4. **No Exceptions**: Code without tests will be rejected in code review

**Enforcement:**

- Husky pre-commit hook runs `pnpm test` before allowing commits
- GitHub Actions CI runs full test suite on every push and PR
- Coverage thresholds enforced: 70% overall, 80% components, 90% store/utils
- Failed tests block PR merges

## Test Stack

- **Test Runner**: Vitest with globals enabled
- **Component Testing**: React Testing Library
- **User Interactions**: @testing-library/user-event
- **DOM Matchers**: @testing-library/jest-dom
- **E2E Testing**: Playwright
- **Coverage Provider**: @vitest/coverage-v8

## Test Structure

### Mandatory Test Files

**Every source file MUST have a corresponding test file:**

```
✅ Component with test
src/components/atoms/Button/
├── Button.tsx          ← Source file
├── Button.test.tsx     ← REQUIRED test file
└── index.ts

✅ Utility with test
src/utils/
├── formatters.ts       ← Source file
└── formatters.test.ts  ← REQUIRED test file

✅ Store with test
src/store/
├── workout-store.ts       ← Source file
└── workout-store.test.ts  ← REQUIRED test file

❌ Missing test (REJECTED)
src/components/atoms/Badge/
├── Badge.tsx           ← Source file
└── index.ts            ← NO TEST FILE = REJECTED
```

### Co-located Tests

Tests MUST be co-located with the component they test:

```
src/components/atoms/Button/
├── Button.tsx
├── Button.test.tsx
└── index.ts
```

### AAA Pattern (Arrange-Act-Assert)

All tests MUST follow the AAA pattern with clear sections separated by blank lines:

```typescript
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
```

## Component Testing

### Rendering Tests

Test that components render correctly with different props:

```typescript
describe("rendering", () => {
  it("should render with default props", () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary-600");
  });

  it("should render children content", () => {
    // Arrange & Act
    render(<Button>Test Content</Button>);

    // Assert
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });
});
```

### Interaction Tests

Test user interactions using `userEvent`:

```typescript
describe("interactions", () => {
  it("should call onClick when clicked", async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    await user.click(screen.getByRole("button"));

    // Assert
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should not call onClick when disabled", async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    // Act
    await user.click(screen.getByRole("button"));

    // Assert
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

### State Tests

Test component state changes and conditional rendering:

```typescript
describe("states", () => {
  it("should be disabled when disabled prop is true", () => {
    // Arrange & Act
    render(<Button disabled>Disabled</Button>);

    // Assert
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:cursor-not-allowed");
  });

  it("should show loading spinner when loading", () => {
    // Arrange & Act
    render(<Button loading>Loading</Button>);

    // Assert
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    const spinner = button.querySelector("svg");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });
});
```

## Store Testing (Zustand)

### Store Setup

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

  // Tests...
});
```

### Testing Store Actions

Test store actions directly using `getState()`:

```typescript
describe("loadWorkout", () => {
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

### Testing Store Selectors

Test that selectors return correct values:

```typescript
describe("selector hooks", () => {
  it("should provide access to currentWorkout", () => {
    // Arrange
    const mockKrd: KRD = {
      /* ... */
    };
    useWorkoutStore.setState({ currentWorkout: mockKrd });

    // Act
    const workout = useWorkoutStore.getState().currentWorkout;

    // Assert
    expect(workout).toEqual(mockKrd);
  });
});
```

## Query Priorities

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

## Async Operations

### User Interactions

Always use `await` with user interactions:

```typescript
it("should update input value", async () => {
  // Arrange
  const user = userEvent.setup();
  render(<Input />);

  // Act
  await user.type(screen.getByRole("textbox"), "Hello");

  // Assert
  expect(screen.getByRole("textbox")).toHaveValue("Hello");
});
```

### Waiting for Elements

Use `waitFor` for async state changes:

```typescript
it("should show success message after save", async () => {
  // Arrange
  const user = userEvent.setup();
  render(<WorkoutForm />);

  // Act
  await user.click(screen.getByRole("button", { name: /save/i }));

  // Assert
  await waitFor(() => {
    expect(screen.getByText("Workout saved")).toBeInTheDocument();
  });
});
```

## Test Utilities

### Custom Render Function

Use `renderWithProviders` for components that need context:

```typescript
import { renderWithProviders, screen, userEvent } from "@/test-utils";

it("should render with providers", () => {
  // Arrange & Act
  renderWithProviders(<MyComponent />);

  // Assert
  expect(screen.getByText("Content")).toBeInTheDocument();
});
```

### Shared Fixtures

Use shared fixtures from `test-utils/fixtures.ts`:

```typescript
import { buildWorkoutStep, buildKRD } from "@/test-utils/fixtures";

it("should display workout step", () => {
  // Arrange
  const step = buildWorkoutStep.build({
    durationType: "time",
    duration: { type: "time", seconds: 300 },
  });

  // Act
  render(<StepCard step={step} />);

  // Assert
  expect(screen.getByText("5:00")).toBeInTheDocument();
});
```

## Coverage Requirements

### Thresholds

- **Overall**: ≥ 70% (lines, functions, branches, statements)
- **Components**: ≥ 80% for atoms and molecules
- **Store**: ≥ 90% for state management
- **Utils**: ≥ 90% for utility functions

### Excluded from Coverage

- Configuration files (`*.config.ts`, `*.config.js`)
- Test files (`*.test.ts`, `*.test.tsx`)
- Test utilities (`test-setup.ts`, `test-utils.tsx`)
- Type definitions (`*.d.ts`, `types/**`)
- Entry points (`main.tsx`)

## E2E Testing (Playwright)

### Test Organization

E2E tests are located in the `e2e/` directory:

```
e2e/
├── workout-load-edit-save.spec.ts
├── workout-creation.spec.ts
├── mobile-responsive.spec.ts
├── accessibility.spec.ts
└── README.md
```

### E2E Test Structure

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

### E2E Best Practices

1. **Use semantic selectors** - `getByRole`, `getByLabel`, `getByText`
2. **Wait for visibility** - `await expect(...).toBeVisible()`
3. **Test user flows** - Complete scenarios, not isolated actions
4. **Keep tests independent** - Each test should work in isolation
5. **Add requirement comments** - Document what requirement is being tested
6. **Update E2E tests for UI changes** - MANDATORY: When adding or modifying UI functionality, ALWAYS update corresponding E2E tests

### CRITICAL: E2E Test Updates for UI Changes

**MANDATORY RULE**: Every UI functionality change MUST include E2E test updates.

**When to update E2E tests:**

- ✅ Adding new interactive elements (buttons, inputs, toggles)
- ✅ Modifying existing user flows (navigation, forms, dialogs)
- ✅ Adding new pages or sections
- ✅ Changing keyboard shortcuts or accessibility features
- ✅ Modifying theme or visual modes
- ✅ Adding new user actions (save, delete, copy, etc.)

**Examples:**

```typescript
// ❌ BAD: Added theme toggle to UI but no E2E test
// Component: ThemeToggle.tsx added to header
// E2E: No test added ← REJECTED

// ✅ GOOD: Added theme toggle with E2E test
// Component: ThemeToggle.tsx added to header
// E2E: accessibility.spec.ts updated with theme toggle tests

test("should toggle between light and dark themes", async ({ page }) => {
  await page.goto("/");

  // Verify initial theme
  const html = page.locator("html");
  const initialHasClass = await html.evaluate((el) =>
    el.classList.contains("dark")
  );

  // Click theme toggle
  await page
    .getByRole("button", { name: /switch to (light|dark) mode/i })
    .click();

  // Verify theme changed
  const newHasClass = await html.evaluate((el) =>
    el.classList.contains("dark")
  );
  expect(newHasClass).not.toBe(initialHasClass);
});
```

**Enforcement:**

- Code review will reject PRs with UI changes but no E2E test updates
- CI/CD pipeline must show E2E tests covering new functionality
- Document which E2E test file was updated in PR description

### Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run in UI mode (interactive)
pnpm test:e2e:ui

# Run specific browser
pnpm test:e2e --project=chromium

# Run mobile tests
pnpm test:e2e --project="Mobile Chrome"
```

## What NOT to Test

### Don't Test Implementation Details

```typescript
// ❌ Bad - Testing internal state
expect(component.state.count).toBe(5);

// ✅ Good - Testing user-visible behavior
expect(screen.getByText("Count: 5")).toBeInTheDocument();
```

### Don't Test Third-Party Libraries

```typescript
// ❌ Bad - Testing React Testing Library
expect(render).toBeDefined();

// ✅ Good - Testing your component
expect(screen.getByRole("button")).toBeInTheDocument();
```

### Don't Test Types

```typescript
// ❌ Bad - TypeScript validates types at compile time
const props: ButtonProps = { variant: "primary" };
expect(props.variant).toBe("primary");

// ✅ Good - Test component behavior
render(<Button variant="primary">Click</Button>);
expect(screen.getByRole("button")).toHaveClass("bg-primary-600");
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

### ❌ DON'T

1. **Don't test implementation details** - Test behavior, not internals
2. **Don't use `getByTestId` as first choice** - Use semantic queries
3. **Don't test third-party libraries** - Trust they work correctly
4. **Don't mock internal logic** - Only mock external dependencies
5. **Don't write brittle tests** - Avoid testing exact CSS classes
6. **Don't test types** - TypeScript handles type checking
7. **Don't forget to cleanup** - React Testing Library handles this automatically
8. **Don't use `act()` directly** - Use `waitFor()` or `await` user events

## Running Tests

### Local Development

```bash
# Run all tests once (required before commit)
pnpm test

# Run tests in watch mode (during development)
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage (verify thresholds)
pnpm test -- --coverage

# Run specific test file
pnpm test Button.test.tsx

# Run E2E tests
pnpm test:e2e
```

### Pre-commit Hook (Husky)

**Automatic enforcement before every commit:**

```bash
# Husky runs automatically on git commit
git commit -m "feat: add new component"

# Husky will:
# 1. Run pnpm test
# 2. Block commit if tests fail
# 3. Show which tests failed
```

**If tests fail:**

```bash
# Fix the failing tests
pnpm test:watch

# Commit again after tests pass
git commit -m "feat: add new component"
```

### CI/CD Pipeline

**GitHub Actions runs on every push and PR:**

1. **Unit Tests**: `pnpm test` in workout-spa-editor package (Vitest)
2. **E2E Tests**: `pnpm test:e2e` across all browsers (Playwright)
3. **Coverage Check**: Enforces 70% threshold
4. **Build Verification**: Ensures production build succeeds
5. **Lint Check**: ESLint + Prettier validation
6. **Type Check**: TypeScript compilation without emit

**Pipeline must be green before merge:**

- ✅ All unit tests passing (Vitest)
- ✅ All E2E tests passing (Playwright - chromium, firefox, webkit)
- ✅ All mobile E2E tests passing (Mobile Chrome, Mobile Safari)
- ✅ Coverage thresholds met (≥70% overall)
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Production build succeeds

**Current CI Configuration:**

- `.github/workflows/ci.yml` - Core package tests + Frontend unit tests
- `.github/workflows/workout-spa-editor-e2e.yml` - Frontend E2E tests
- ✅ **CONFIGURED**: Frontend unit tests now run in CI/CD pipeline

**CI Jobs:**

- `test` - Core package unit tests (Vitest)
- `test-frontend` - Frontend unit tests (Vitest)
- `e2e-tests` - Frontend E2E tests (Playwright)
- `lint` - ESLint + Prettier
- `typecheck` - TypeScript compilation
- `build` - Production build verification
- `round-trip` - Round-trip conversion tests

## Troubleshooting

### Tests fail with "act(...)" warnings

Wrap state updates in `waitFor()`:

```typescript
await waitFor(() => {
  expect(screen.getByText("Updated")).toBeInTheDocument();
});
```

### Tests timeout

Increase timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 10000, // 10 seconds
}
```

### Coverage provider not found

Ensure `@vitest/coverage-v8` version matches `vitest` version:

```bash
pnpm add -D @vitest/coverage-v8@3.2.4
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Documentation](https://playwright.dev/)
