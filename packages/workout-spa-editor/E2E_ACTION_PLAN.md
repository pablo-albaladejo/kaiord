# E2E Test Verification - Action Plan

**Task**: P1b.4 E2E Testing Verification  
**Status**: ⚠️ BLOCKED - Critical Issues Identified  
**Date**: 2025-01-15

## Test Results Summary

- **Total Tests**: 75 (15 test cases × 5 browsers/devices)
- **Passed**: 18 tests (24%)
- **Failed**: 57 tests (76%)

## Critical Findings

### ✅ What's Working

1. **Basic Accessibility** (14/25 tests passing)
   - Keyboard navigation works
   - ARIA labels present
   - Focus indicators visible (most browsers)
   - Color contrast maintained

2. **Error Handling** (2/15 tests passing)
   - File parsing errors detected (WebKit, Mobile Safari)
   - Invalid JSON handled gracefully

### ❌ What's Broken

1. **Keyboard Shortcuts** (0/25 tests passing)
   - **Root Cause**: `useKeyboardShortcuts` hook NOT IMPLEMENTED
   - Ctrl+Z, Ctrl+Y, Ctrl+S don't work
   - Tests timeout waiting for shortcuts

2. **File Upload Flow** (13/15 tests failing)
   - **Root Cause**: Tests may not be waiting for async file processing
   - Workout loads but tests don't detect it
   - Need to investigate FileUpload component behavior

3. **Step Management** (0/15 tests passing)
   - **Root Cause**: Tests fail to reach step management due to upstream failures
   - "Add Step" button exists but tests can't find it
   - Likely timing issue with workout loading

4. **Mobile Touch Support** (18/20 tests failing)
   - **Root Cause**: Playwright config missing `hasTouch: true`
   - Touch targets too small (40px vs 44px required)
   - `.tap()` method fails

5. **"Create New Workout" Button** (Multiple tests failing)
   - **Root Cause**: Feature NOT IMPLEMENTED
   - Tests expect button that doesn't exist
   - Tests should be marked as `.skip()` or removed

## Immediate Actions Required

### 1. Implement Keyboard Shortcuts (HIGH PRIORITY)

**Estimated Time**: 1-2 hours

Create `src/hooks/useKeyboardShortcuts.ts`:

```typescript
import { useEffect } from "react";
import { useUndo, useRedo } from "../store/workout-store-selectors";
import { saveWorkout } from "../utils/save-workout";

export function useKeyboardShortcuts(krd: KRD | null) {
  const undo = useUndo();
  const redo = useRedo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z (undo)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Cmd+Shift+Z (redo)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }

      // Ctrl+S or Cmd+S (save)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (krd) {
          saveWorkout(krd);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, krd]);
}
```

Add to `App.tsx`:

```typescript
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

function App() {
  const currentWorkout = useCurrentWorkout();
  useKeyboardShortcuts(currentWorkout); // Add this line
  // ... rest of component
}
```

### 2. Fix Mobile Touch Support (MEDIUM PRIORITY)

**Estimated Time**: 30 minutes

Update `playwright.config.ts`:

```typescript
projects: [
  // ... existing projects
  {
    name: "Mobile Chrome",
    use: {
      ...devices["Pixel 5"],
      hasTouch: true, // Add this
    },
  },
  {
    name: "Mobile Safari",
    use: {
      ...devices["iPhone 12"],
      hasTouch: true, // Add this
    },
  },
],
```

Fix button sizes in `Button.tsx`:

```typescript
// Ensure minimum 44x44px touch targets
const sizeClasses = {
  sm: "min-h-[44px] min-w-[44px] px-3 py-2 text-sm",
  md: "min-h-[44px] min-w-[44px] px-4 py-2 text-base",
  lg: "min-h-[48px] min-w-[48px] px-6 py-3 text-lg",
};
```

### 3. Update Tests for Unimplemented Features (LOW PRIORITY)

**Estimated Time**: 30 minutes

Mark unimplemented features as skipped:

```typescript
// mobile-responsive.spec.ts
test.skip("should scroll smoothly on mobile", async ({ page }) => {
  // This test expects "Create New Workout" button which doesn't exist
  // TODO: Implement workout creation UI
});

test.skip("should adapt layout for tablet screens", async ({ page }) => {
  // This test expects "Create New Workout" button which doesn't exist
  // TODO: Implement workout creation UI
});
```

### 4. Investigate File Upload Timing (MEDIUM PRIORITY)

**Estimated Time**: 1 hour

Add explicit waits in tests:

```typescript
// Wait for workout to be fully loaded and rendered
await fileInput.setInputFiles({ ... });
await page.waitForTimeout(1000); // Give time for async processing
await expect(page.getByText("Test Workout")).toBeVisible({ timeout: 10000 });
```

Or better, wait for specific state changes:

```typescript
// Wait for workout stats to appear (indicates workout is loaded)
await expect(page.getByText(/Total Duration/i)).toBeVisible({ timeout: 10000 });
```

## Test Execution Plan

### Phase 1: Quick Wins (30 minutes)

1. ✅ Run tests and document results (DONE)
2. ⏳ Add `hasTouch: true` to mobile configs
3. ⏳ Fix button sizes to meet 44x44px minimum
4. ⏳ Skip tests for unimplemented features

**Expected Improvement**: 18 → 25 passing tests (33%)

### Phase 2: Keyboard Shortcuts (1-2 hours)

1. ⏳ Implement `useKeyboardShortcuts` hook
2. ⏳ Add hook to App.tsx
3. ⏳ Test manually (Ctrl+Z, Ctrl+Y, Ctrl+S)
4. ⏳ Re-run E2E tests

**Expected Improvement**: 25 → 40 passing tests (53%)

### Phase 3: File Upload Investigation (1 hour)

1. ⏳ Debug FileUpload component
2. ⏳ Add explicit waits in tests
3. ⏳ Verify workout loading works
4. ⏳ Re-run E2E tests

**Expected Improvement**: 40 → 60 passing tests (80%)

### Phase 4: Final Polish (1 hour)

1. ⏳ Fix remaining flaky tests
2. ⏳ Add better error messages
3. ⏳ Verify all critical flows work
4. ⏳ Document any remaining issues

**Expected Improvement**: 60 → 70+ passing tests (93%+)

## Success Criteria

To mark P1b.4 as complete, we need:

- ✅ All critical user flows passing (Requirements 1, 2, 3, 5, 6, 7, 15, 16)
- ✅ Keyboard shortcuts working (Requirement 29)
- ✅ Mobile tests passing (Requirement 8)
- ✅ Accessibility tests passing (Requirement 35)
- ✅ At least 90% of tests passing (68/75 tests)
- ✅ CI/CD pipeline green

## Current Blockers

1. **Keyboard shortcuts not implemented** - CRITICAL
2. **Mobile touch support missing** - HIGH
3. **File upload timing issues** - MEDIUM
4. **Tests expect unimplemented features** - LOW

## Recommendation

**DO NOT mark P1b.4 as complete** until:

1. Keyboard shortcuts are implemented
2. Mobile touch support is fixed
3. At least 90% of tests are passing
4. All critical user flows work

**Estimated Total Time**: 4-6 hours of focused development

---

**Next Steps**: Implement keyboard shortcuts hook (Phase 2)
