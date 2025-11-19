# Design Document

## Overview

This design addresses critical issues identified in PR #25 code review, focusing on correctness, accessibility, type safety, and performance. The fixes are categorized into three priority levels: Critical (bugs and accessibility), Major (type safety and performance), and Minor (documentation and test reliability).

## Architecture

### Component Structure

```
packages/
├── core/src/adapters/fit/
│   ├── krd-to-fit/
│   │   └── krd-to-fit-metadata.mapper.ts    # Fix: NaN validation
│   └── round-trip/
│       └── round-trip-swimming.test.ts       # Fix: Optional chaining
├── core/src/adapters/zwift/
│   └── xsd-validator.test.ts                 # Fix: Module caching
└── workout-spa-editor/src/
    ├── components/molecules/ExportFormatSelector/
    │   ├── FormatDropdown.tsx                # Fix: Keyboard navigation
    │   └── FormatWarnings.tsx                # Fix: Type safety
    ├── store/actions/
    │   └── create-repetition-block-action.ts # Fix: Insertion bug
    ├── utils/
    │   └── json-parser.ts                    # Fix: Performance
    └── TEST_COVERAGE_SUMMARY.md              # Fix: Documentation
```

## Components and Interfaces

### 1. Repetition Block Insertion Fix

**Current Issue**: Uses `stepIndex` as array index, which breaks when repetition blocks exist.

**Solution**: Track actual array position during iteration.

```typescript
// Before
const sortedIndices = [...stepIndices].sort((a, b) => a - b);
const insertPosition = sortedIndices[0]; // Wrong: uses stepIndex

// After
const selectedIndices = new Set(stepIndices);
let insertPosition: number | null = null;

workout.steps.forEach((step, index) => {
  if (isWorkoutStep(step) && selectedIndices.has(step.stepIndex)) {
    if (insertPosition === null) {
      insertPosition = index; // Correct: uses array index
    }
  }
});
```

### 2. Keyboard Navigation for Dropdowns

**Current Issue**: No keyboard support for dropdown navigation.

**Solution**: Add keyboard event handlers and focus management.

```typescript
interface KeyboardNavigationState {
  focusedIndex: number;
  isOpen: boolean;
}

const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case "ArrowDown":
      setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
      break;
    case "ArrowUp":
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
      break;
    case "Enter":
    case " ":
      onSelect(options[focusedIndex]);
      onClose();
      break;
    case "Escape":
      onClose();
      break;
  }
};
```

### 3. NaN Validation Pattern

**Current Issue**: `serialNumber` parsing doesn't validate for NaN.

**Solution**: Apply consistent validation pattern.

```typescript
// Consistent pattern for all numeric parsing
if (krd.metadata.serialNumber) {
  const serialNumber = parseInt(krd.metadata.serialNumber, 10);
  if (!isNaN(serialNumber)) {
    fileId.serialNumber = serialNumber;
  }
}
```

### 4. Module Reloading for Environment Tests

**Current Issue**: `isBrowser` is cached at module load time.

**Solution**: Use `vi.resetModules()` and dynamic imports.

```typescript
it("should use correct validator in browser", async () => {
  const originalWindow = global.window;
  global.window = {} as any;

  vi.resetModules(); // Force module reload
  const { createZwiftValidator } = await import("./xsd-validator");

  const validator = createZwiftValidator(logger);
  // Test browser-specific behavior

  global.window = originalWindow;
});
```

### 5. Type Safety Improvements

**Current Issue**: Using `unknown` and `never` casts.

**Solution**: Use proper types from domain.

```typescript
// Before
type FormatWarningsProps = {
  workout?: unknown;
};
const warning = getFormatWarnings(format as never, workout as never);

// After
import type { KRD } from "@kaiord/core";

type FormatWarningsProps = {
  workout?: KRD;
};
const warning = getFormatWarnings(format, workout);
```

### 6. JSON Parser Performance

**Current Issue**: O(n²) character-by-character fallback.

**Solution**: Remove fallback, accept undefined location.

```typescript
// Before
for (let i = 0; i < text.length; i++) {
  try {
    JSON.parse(text.substring(0, i)); // O(n²)
  } catch (e) {
    // Track position
  }
}

// After
const match = error.message.match(/position (\d+)/);
const line = match ? parseInt(match[1]) : undefined;
const column = undefined;
// O(1) pattern matching, accept undefined when it fails
```

## Data Models

### KeyboardNavigationState

```typescript
type KeyboardNavigationState = {
  focusedIndex: number; // Currently focused option index
  isOpen: boolean; // Dropdown open state
};
```

### InsertionContext

```typescript
type InsertionContext = {
  selectedIndices: Set<number>; // O(1) lookup
  insertPosition: number | null; // Actual array index
  stepsToWrap: WorkoutStep[]; // Steps to include in block
  remainingSteps: (WorkoutStep | RepetitionBlock)[]; // Other steps
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Repetition block insertion preserves step order

_For any_ workout with existing steps and repetition blocks, when creating a new repetition block from selected steps, the relative order of all non-selected steps and existing blocks should remain unchanged.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Keyboard navigation cycles within bounds

_For any_ dropdown with N options, pressing Arrow Down from option N-1 should keep focus at N-1, and pressing Arrow Up from option 0 should keep focus at 0.

**Validates: Requirements 2.2, 2.3**

### Property 3: Keyboard selection matches mouse selection

_For any_ dropdown option, selecting it via Enter/Space should produce the same result as clicking it with a mouse.

**Validates: Requirements 2.4**

### Property 4: NaN validation prevents invalid assignments

_For any_ string value that parses to NaN, the parsed value should not be assigned to numeric fields.

**Validates: Requirements 3.1, 3.2**

### Property 5: Test assertions always execute

_For any_ test using expect, the assertion should execute regardless of whether the value is defined or undefined.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Environment detection reflects current state

_For any_ test that modifies global.window, the module's isBrowser flag should reflect the modified state after module reload.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Type checking catches mismatches

_For any_ function call with typed parameters, passing arguments of incorrect types should produce TypeScript compile errors.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 8: JSON parsing is linear time

_For any_ JSON string of length N, error location extraction should complete in O(N) time or better.

**Validates: Requirements 7.3, 7.5**

## Error Handling

### Validation Errors

- **NaN Detection**: Silent skip (no error thrown)
- **Type Mismatches**: Compile-time TypeScript errors
- **JSON Parsing**: Runtime error with location (if available)

### User-Facing Errors

- **Keyboard Navigation**: No errors (graceful degradation)
- **Repetition Block Creation**: No errors (validated input)

### Developer Errors

- **Test Failures**: Clear assertion messages
- **Type Errors**: Descriptive TypeScript diagnostics

## Testing Strategy

### Unit Tests

**Repetition Block Insertion**:

- Test with empty workout
- Test with existing steps only
- Test with existing repetition blocks
- Test with mixed steps and blocks
- Test with non-contiguous selection

**Keyboard Navigation**:

- Test Arrow Up/Down navigation
- Test Enter/Space selection
- Test Escape closing
- Test focus initialization
- Test disabled state

**NaN Validation**:

- Test valid numeric strings
- Test invalid numeric strings
- Test empty strings
- Test undefined values

**Type Safety**:

- Compile-time verification (no runtime tests needed)

### Integration Tests

**Module Reloading**:

- Test browser environment simulation
- Test Node.js environment simulation
- Test global.window restoration

**JSON Parser**:

- Test with valid JSON
- Test with invalid JSON (various error types)
- Test with large JSON files (performance)

### Property-Based Tests

**Property 1: Insertion order preservation**

- Generate random workouts with steps and blocks
- Select random step indices
- Verify non-selected items maintain order

**Property 2: Keyboard navigation bounds**

- Generate dropdowns with random option counts
- Test navigation at boundaries
- Verify focus stays within bounds

**Property 3: NaN validation consistency**

- Generate random strings (numeric and non-numeric)
- Parse all strings
- Verify NaN values are never assigned

**Property 4: JSON parsing performance**

- Generate JSON strings of varying sizes
- Measure parsing time
- Verify linear or better complexity

### Test Configuration

- **Framework**: Vitest for unit/integration, Playwright for E2E
- **Coverage Target**: ≥ 90% for bug fixes, ≥ 80% for new features
- **Property Test Iterations**: 100 per property
- **Performance Benchmarks**: JSON parsing < 10ms for 1MB files

## Implementation Notes

### Priority Order

1. **Critical** (P0): Repetition block bug, keyboard navigation, environment tests
2. **Major** (P1): NaN validation, type safety, JSON performance
3. **Minor** (P2): Test assertions, documentation

### Dependencies

- No new external dependencies required
- Uses existing Vitest mocking capabilities
- Uses existing React hooks (useState, useEffect, useRef)

### Backward Compatibility

- All fixes are backward compatible
- No breaking changes to public APIs
- Existing tests continue to pass

### Performance Impact

- **Positive**: JSON parser O(n²) → O(n)
- **Positive**: Repetition block insertion O(n) → O(n) with Set lookup
- **Neutral**: Keyboard navigation (new feature, no baseline)
- **Neutral**: Other fixes (no performance impact)
