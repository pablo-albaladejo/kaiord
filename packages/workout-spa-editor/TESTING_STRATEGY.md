# Drag-and-Drop Testing Strategy

## Overview

Comprehensive testing strategy for drag-and-drop step reordering functionality, covering unit tests, component tests, integration tests, and E2E tests.

## Test Coverage

### Unit Tests (80%+ coverage)

**Location:** `src/components/organisms/WorkoutList/use-workout-list-dnd.test.ts`

Tests the drag-and-drop hook logic:

- ✅ Sortable ID generation for steps and repetition blocks
- ✅ Drag end event handling
- ✅ Edge cases (same position, null over, no callback)
- ✅ Sensor configuration
- ✅ Collision detection

**Location:** `src/store/actions/reorder-step-action.test.ts`

Tests the reorder action logic:

- ✅ Step reordering with index updates
- ✅ Edge cases (same position, out of bounds)
- ✅ Repetition block handling
- ✅ Step index recalculation

### Component Tests (70%+ coverage)

**Location:** `src/components/organisms/WorkoutList/WorkoutList.test.tsx`

Tests the WorkoutList component:

- ✅ Rendering workout steps
- ✅ Rendering repetition blocks
- ✅ Step selection handling
- ✅ Selected step highlighting
- ✅ Mixed steps and blocks
- ✅ Custom className application

**Location:** `src/components/molecules/StepCard/StepCard.test.tsx`

Tests the StepCard component:

- ✅ Rendering step information
- ✅ Click handling
- ✅ Visual states (selected, hover)
- ✅ Drag handle visibility

### Integration Tests

**Location:** `src/components/organisms/WorkoutList/WorkoutList.integration.test.tsx`

Tests the complete drag-and-drop flow:

- ✅ DndContext wrapper integration
- ✅ Sortable items rendering
- ✅ Empty workout handling
- ✅ Repetition block integration
- ✅ Accessibility during drag operations
- ✅ Performance with 50+ steps (< 200ms)

### E2E Tests

**Location:** `e2e/drag-drop-reordering.spec.ts`

Tests real user interactions:

#### Mouse Drag-and-Drop

- ✅ Reorder steps using mouse drag
- ✅ Visual feedback during drag
- ✅ Drop target indication

#### Keyboard Shortcuts (Requirement 29)

- ✅ Alt+Up to move step up
- ✅ Alt+Down to move step down
- ✅ Boundary conditions (first/last step)

#### Undo/Redo

- ✅ Undo reorder operation (Ctrl+Z)
- ✅ Redo reorder operation (Ctrl+Y)

#### Performance

- ✅ Handle 50+ steps efficiently
- ✅ Maintain data integrity after reordering

#### Mobile Touch

- ✅ Touch drag on mobile devices
- ✅ Responsive layout on small screens

## Test Execution

### Run All Tests

```bash
pnpm test
```

### Run Unit Tests Only

```bash
pnpm vitest run
```

### Run E2E Tests Only

```bash
pnpm playwright test drag-drop-reordering.spec.ts
```

### Run with Coverage

```bash
pnpm vitest run --coverage
```

## Coverage Targets

- **Overall:** ≥ 70%
- **Components:** ≥ 80% (atoms and molecules)
- **Store:** ≥ 90% (state management)
- **Utils:** ≥ 90% (utility functions)

## Requirements Validation

### Requirement 3 (Step Reordering)

- ✅ 3.1: Drag-and-drop functionality enabled
- ✅ 3.2: Visual feedback during drag
- ✅ 3.3: Step indices updated on drop
- ✅ 3.4: Repetition block integrity maintained
- ✅ 3.5: Cross-block reordering supported

### Requirement 29 (Keyboard Shortcuts)

- ✅ 29.1: Alt+Up moves step up
- ✅ 29.2: Alt+Down moves step down

## Test Maintenance

### Adding New Tests

1. Follow AAA pattern (Arrange-Act-Assert)
2. Use descriptive test names
3. Test one behavior per test
4. Keep tests focused and minimal

### Updating Tests

1. Update tests when requirements change
2. Maintain coverage targets
3. Run full test suite before committing
4. Update E2E tests for UI changes

## CI/CD Integration

Tests run automatically on:

- Every commit (pre-commit hook)
- Every push to remote
- Every pull request
- Before merging to main

All tests must pass before code can be merged.
