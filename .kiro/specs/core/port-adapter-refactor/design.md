# Design Document

## Overview

This design outlines the refactoring strategy to migrate from object-with-methods pattern to direct function types for PORTs and ADAPTERs in Kaiord. The refactor will be done in a systematic way to ensure no functionality is broken while improving code quality and maintainability.

## Architecture

### Current Pattern (Before)

```
PORT (Object with methods)
  ↓
ADAPTER (Returns object with methods)
  ↓
USE-CASE (Calls port.method())
```

### New Pattern (After)

```
PORT (Direct function type)
  ↓
ADAPTER (Returns direct function)
  ↓
USE-CASE (Calls port() directly)
```

## Components and Interfaces

### 1. PORT Definitions

**Location:** `packages/core/src/ports/`

**Files to refactor:**

- `fit-reader.ts`
- `fit-writer.ts`
- `logger.ts` (if needed)
- `schema-validator.ts` (if needed)

**Transformation:**

```typescript
// BEFORE
export type FitReader = {
  readToKRD: (buffer: Uint8Array) => Promise<KRD>;
};

// AFTER
export type FitReader = (buffer: Uint8Array) => Promise<KRD>;
```

**Design Decision:** Use direct function types for single-operation ports. This simplifies the type definition and makes it more functional. For ports with multiple operations, we'll evaluate case-by-case (Logger may stay as object).

### 2. ADAPTER Implementations

**Location:** `packages/core/src/adapters/`

**Files to refactor:**

- `adapters/fit/garmin-fitsdk.ts`
- Any other adapter implementations

**Transformation:**

```typescript
// BEFORE
export const createGarminFitSdkReader = (logger: Logger): FitReader => ({
  readToKRD: async (buffer: Uint8Array): Promise<KRD> => {
    // implementation
  },
});

// AFTER
export const createGarminFitSdkReader =
  (logger: Logger): FitReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
    // implementation (unchanged)
  };
```

**Design Decision:** Use currying pattern where the factory function receives dependencies and returns the PORT function directly. All implementation logic remains the same, only the wrapping changes.

### 3. Use-Case Updates

**Location:** `packages/core/src/application/use-cases/`

**Files to refactor:**

- `convert-fit-to-krd.ts`
- `convert-krd-to-fit.ts`
- `validate-round-trip.ts` (if exists)
- Any other use-cases using these ports

**Transformation:**

```typescript
// BEFORE
const krd = await fitReader.readToKRD(params.fitBuffer);

// AFTER
const krd = await fitReader(params.fitBuffer);
```

**Design Decision:** Direct function calls are cleaner and more functional. The use-case logic remains unchanged, only the invocation syntax changes.

### 4. Test Updates

**Location:** Co-located with source files (`.test.ts`)

**Files to refactor:**

- `convert-fit-to-krd.test.ts`
- `convert-krd-to-fit.test.ts`
- `garmin-fitsdk.test.ts`
- Any other test files mocking these ports

**Transformation:**

```typescript
// BEFORE
const mockFitReader: FitReader = {
  readToKRD: vi.fn().mockResolvedValue(expectedKrd),
};

// AFTER
const mockFitReader = vi.fn<FitReader>().mockResolvedValue(expectedKrd);
```

**Design Decision:** Use Vitest's typed mock functions for better type safety and simpler syntax.

### 5. Provider Composition

**Location:** `packages/core/src/application/providers.ts`

**Transformation:**

```typescript
// BEFORE
const fitReader = createGarminFitSdkReader(logger);
const result = await fitReader.readToKRD(buffer);

// AFTER
const fitReader = createGarminFitSdkReader(logger);
const result = await fitReader(buffer);
```

**Design Decision:** The factory function call remains the same, only the usage changes. This maintains the composition API.

## Data Models

No changes to data models. All domain types (KRD, Workout, etc.) remain unchanged.

## Error Handling

**Strategy:** Maintain all existing error handling logic.

- All `try-catch` blocks remain in place
- All error transformations remain unchanged
- All domain error types remain unchanged
- Error propagation patterns remain unchanged

**Rationale:** This refactor is purely structural. Error handling is business logic that should not change.

## Testing Strategy

### Unit Tests

**Approach:** Update mocks to use new pattern, verify all tests pass.

**Steps:**

1. Update mock creation syntax
2. Update mock verification syntax
3. Run tests after each file refactor
4. Ensure 100% of existing tests pass

### Integration Tests

**Approach:** No changes needed to integration tests that use real implementations.

**Rationale:** Integration tests create real adapters and use them. The factory function signature doesn't change, so integration tests continue to work.

### Round-Trip Tests

**Approach:** Run existing round-trip tests to verify data integrity.

**Validation:**

- FIT → KRD → FIT conversions produce identical results
- All tolerance checks pass
- No data loss or corruption

## Migration Strategy

### Phase 1: Update PORTs

1. Update `fit-reader.ts` to function type
2. Update `fit-writer.ts` to function type
3. Verify types compile (will have errors in adapters/use-cases)

### Phase 2: Update ADAPTERs

1. Update `garmin-fitsdk.ts` reader implementation
2. Update `garmin-fitsdk.ts` writer implementation
3. Verify types compile (will have errors in use-cases)

### Phase 3: Update Use-Cases

1. Update `convert-fit-to-krd.ts`
2. Update `convert-krd-to-fit.ts`
3. Update any other use-cases
4. Verify types compile

### Phase 4: Update Tests

1. Update use-case tests
2. Update adapter tests (if needed)
3. Run all tests, verify 100% pass

### Phase 5: Update Providers

1. Update `providers.ts` if needed
2. Verify CLI still works
3. Run integration tests

### Phase 6: Documentation

1. Update steering document with completion note
2. Document any lessons learned
3. Update code examples in steering

## Rollback Plan

If issues are discovered:

1. Git revert to previous commit
2. Analyze the issue
3. Fix in isolation
4. Re-apply changes

**Mitigation:** Make small, atomic commits for each phase. This allows easy rollback of specific changes.

## Performance Considerations

**Expected Impact:** None. This is a structural refactor with no runtime performance implications.

**Rationale:**

- Function calls vs method calls have identical performance
- No additional allocations or operations
- Same execution paths

## Security Considerations

**Expected Impact:** None. No security-related code is being modified.

**Validation:** All existing security measures (error handling, validation) remain in place.

## Dependencies

**External Dependencies:** No changes to external dependencies.

**Internal Dependencies:**

- All changes are internal to `@kaiord/core`
- No changes to `@kaiord/cli` needed (uses providers)
- No changes to public API

## Success Criteria

1. ✅ All TypeScript compilation errors resolved
2. ✅ All existing tests pass (100%)
3. ✅ CLI commands produce identical output
4. ✅ Round-trip tests pass with same tolerances
5. ✅ Code follows steering document patterns
6. ✅ No regression in functionality
7. ✅ Improved code readability and maintainability

## Timeline Estimate

- Phase 1 (PORTs): 5 minutes
- Phase 2 (ADAPTERs): 10 minutes
- Phase 3 (Use-Cases): 10 minutes
- Phase 4 (Tests): 15 minutes
- Phase 5 (Providers): 5 minutes
- Phase 6 (Documentation): 5 minutes

**Total:** ~50 minutes for complete refactor and validation
