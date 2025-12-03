# Design Document

## Overview

This design addresses React warnings caused by passing component-specific props to DOM elements. The solution involves explicitly destructuring all component-specific props before using the spread operator, ensuring only valid HTML attributes reach DOM elements.

## Architecture

### Current Problem

```typescript
// ❌ Current (problematic) pattern
export const RepetitionBlockCard = forwardRef<HTMLDivElement, RepetitionBlockCardProps>(
  ({ block, onEditRepeatCount, onAddStep, /* ... */, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={classes} {...props}>
        {/* Component content */}
      </div>
    );
  }
);
```

The `...props` spread includes component-specific props like `selectedStepId`, `onStepSelect`, etc., which React tries to apply as DOM attributes.

### Solution Pattern

```typescript
// ✅ Fixed pattern
export const RepetitionBlockCard = forwardRef<HTMLDivElement, RepetitionBlockCardProps>(
  (
    {
      // Component-specific props (explicitly destructured)
      block,
      onEditRepeatCount,
      onAddStep,
      onRemoveStep,
      onDuplicateStep,
      onSelectStep,
      onToggleStepSelection,
      onReorderSteps,
      onUngroup,
      onDelete,
      selectedStepIndex,
      selectedStepIds,
      isDragging,
      dragHandleProps,
      blockIndex,
      // HTML attributes (can be spread)
      className = "",
      ...htmlProps // Only contains valid HTML attributes
    },
    ref
  ) => {
    return (
      <div ref={ref} className={classes} {...htmlProps}>
        {/* Component content */}
      </div>
    );
  }
);
```

## Components and Interfaces

### Type Definition Pattern

```typescript
// Separate component-specific props from HTML attributes
type RepetitionBlockCardOwnProps = {
  block: RepetitionBlock;
  onEditRepeatCount?: (count: number) => void;
  onAddStep?: () => void;
  onRemoveStep?: (index: number) => void;
  onDuplicateStep?: (index: number) => void;
  onSelectStep?: (stepId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onReorderSteps?: (activeIndex: number, overIndex: number) => void;
  onUngroup?: () => void;
  onDelete?: () => void;
  selectedStepIndex?: number;
  selectedStepIds?: readonly string[];
  isDragging?: boolean;
  dragHandleProps?: DragHandleProps;
  blockIndex?: number;
};

// Combine with HTML attributes
export type RepetitionBlockCardProps = RepetitionBlockCardOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof RepetitionBlockCardOwnProps>;
```

This approach:

- Clearly separates component props from HTML attributes
- Uses `Omit` to prevent prop name conflicts
- Maintains full type safety
- Makes it explicit which props are component-specific

### Alternative: Simple Approach

For simpler cases, just destructure all component-specific props:

```typescript
export type RepetitionBlockCardProps = HTMLAttributes<HTMLDivElement> & {
  block: RepetitionBlock;
  // ... other component props
};

// In component, destructure ALL component-specific props
const RepetitionBlockCard = forwardRef<
  HTMLDivElement,
  RepetitionBlockCardProps
>(
  (
    {
      block,
      onEditRepeatCount,
      // ... all other component props
      className = "",
      ...htmlProps // Now only contains HTML attributes
    },
    ref
  ) => {
    // ...
  }
);
```

## Data Models

No data model changes required. This is purely a prop handling refactor.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: No DOM prop warnings

_For any_ component that spreads props onto a DOM element, rendering that component should produce zero React warnings about unrecognized props.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Type safety preservation

_For any_ component that is refactored, the TypeScript compiler should continue to enforce the same prop types before and after the refactor.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 3: Behavior preservation

_For any_ component that is refactored, all existing unit tests and E2E tests should continue to pass without modification.

**Validates: Requirements 1.1, 2.4**

### Property 4: HTML attribute forwarding

_For any_ valid HTML attribute passed to a refactored component, that attribute should be correctly applied to the underlying DOM element.

**Validates: Requirements 2.2**

## Error Handling

No special error handling required. TypeScript will catch any prop-related errors at compile time.

## Testing Strategy

### Unit Testing

**Test approach:**

- Verify components render without warnings
- Verify HTML attributes are correctly forwarded
- Verify component-specific props work as expected
- Verify existing tests continue to pass

**Example test:**

```typescript
describe("RepetitionBlockCard prop handling", () => {
  it("should not pass component props to DOM element", () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, "error");
    const block = buildRepetitionBlock.build();

    // Act
    render(
      <RepetitionBlockCard
        block={block}
        onEditRepeatCount={vi.fn()}
        onAddStep={vi.fn()}
        selectedStepIds={["step-1"]}
        data-testid="custom-attr" // Valid HTML attribute
      />
    );

    // Assert
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("React does not recognize")
    );

    // Verify HTML attribute was applied
    const element = screen.getByTestId("custom-attr");
    expect(element).toBeInTheDocument();
  });
});
```

### Property-Based Testing

**Library:** Not applicable for this refactor. Standard unit tests are sufficient.

### Integration Testing

**Test approach:**

- Run existing E2E tests to verify no behavior changes
- Monitor console for warnings during test execution
- Verify all user interactions continue to work

### Console Warning Detection

**Test utility:**

```typescript
// test-utils/console-spy.ts
export const expectNoReactWarnings = () => {
  const consoleSpy = vi.spyOn(console, "error");

  return {
    verify: () => {
      const reactWarnings = consoleSpy.mock.calls.filter(([message]) =>
        typeof message === "string" &&
        message.includes("React does not recognize")
      );

      expect(reactWarnings).toHaveLength(0);
      consoleSpy.mockRestore();
    }
  };
};

// Usage in tests
it("should render without React warnings", () => {
  const warningChecker = expectNoReactWarnings();

  render(<MyComponent {...props} />);

  warningChecker.verify();
});
```

## Implementation Plan

### Phase 1: Fix RepetitionBlockCard

1. Update type definition to separate component props
2. Explicitly destructure all component-specific props
3. Rename `...props` to `...htmlProps` for clarity
4. Verify no warnings in console
5. Run existing tests to verify behavior

### Phase 2: Fix Related Components

1. Identify other components with similar issues
2. Apply same pattern to each component
3. Verify no warnings for each component
4. Run full test suite

### Phase 3: Add Preventive Tests

1. Add unit tests that detect prop warnings
2. Add test utility for console warning detection
3. Document the correct pattern in code style guide

## Best Practices

### DO

✅ Explicitly destructure all component-specific props
✅ Use descriptive names like `htmlProps` or `domProps` for spread
✅ Separate component props from HTML attributes in type definitions
✅ Test for absence of React warnings
✅ Maintain type safety throughout

### DON'T

❌ Spread props without destructuring component-specific ones
❌ Use generic names like `...rest` when spreading to DOM
❌ Mix component props and HTML attributes in type definitions
❌ Ignore React warnings in console
❌ Change component behavior while fixing props

## Migration Checklist

For each affected component:

- [ ] Identify all component-specific props
- [ ] Update type definition (if needed)
- [ ] Explicitly destructure component props
- [ ] Rename spread variable to `htmlProps`
- [ ] Test component renders without warnings
- [ ] Verify existing tests pass
- [ ] Verify HTML attributes still work (data-_, aria-_, etc.)

## References

- [React: Unknown Prop Warning](https://reactjs.org/warnings/unknown-prop.html)
- [TypeScript: Omit Utility Type](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)
- [React: Forwarding Refs](https://reactjs.org/docs/forwarding-refs.html)
