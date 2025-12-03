# Implementation Plan

- [x] 1. Create test utility for detecting React warnings
  - Create `test-utils/console-spy.ts` with `expectNoReactWarnings` helper
  - Add utility to detect "React does not recognize" warnings
  - Export utility for use in component tests
  - _Requirements: 1.5, 2.1_
  - **Status**: ✅ Complete - Utility created and exported from test-utils

- [x] 2. Fix RepetitionBlockCard component
- [x] 2.1 Update RepetitionBlockCard prop handling
  - Explicitly destructure all component-specific props in RepetitionBlockCard
  - Rename `...props` to `...htmlProps` for clarity
  - Ensure only HTML attributes are spread to DOM element
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
  - **Status**: ✅ Complete - All component props explicitly destructured

- [x] 2.2 Add warning detection test for RepetitionBlockCard
  - Add unit test using `expectNoReactWarnings` utility
  - Verify component renders without React warnings
  - Verify HTML attributes (data-_, aria-_) are still forwarded
  - _Requirements: 1.5, 2.2_
  - **Status**: ✅ Complete - Tests added in RepetitionBlockCard.test.tsx

- [x] 2.3 Verify RepetitionBlockCard behavior unchanged
  - Run existing RepetitionBlockCard unit tests
  - Run RepetitionBlockCard accessibility tests
  - Verify all tests pass without modification
  - _Requirements: 3.4_
  - **Status**: ✅ Complete - All existing tests passing

- [x] 3. Fix RepetitionBlockSteps component
- [x] 3.1 Update RepetitionBlockSteps prop handling
  - Review RepetitionBlockSteps for similar prop spreading issues
  - Explicitly destructure component-specific props if needed
  - Ensure only HTML attributes are spread to DOM elements
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
  - **Status**: ✅ Complete - Component props properly handled

- [x] 3.2 Add warning detection test for RepetitionBlockSteps
  - Add unit test using `expectNoReactWarnings` utility
  - Verify component renders without React warnings
  - _Requirements: 1.5_
  - **Status**: ✅ Complete - Tests added in RepetitionBlockSteps.test.tsx

- [x] 4. Fix StepCard component (if affected)
- [x] 4.1 Review StepCard for prop spreading issues
  - Check if StepCard has similar prop spreading issues
  - Explicitly destructure component-specific props if needed
  - Ensure only HTML attributes are spread to DOM elements
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
  - **Status**: ✅ Complete - Component reviewed and fixed

- [x] 4.2 Add warning detection test for StepCard (if needed)
  - Add unit test using `expectNoReactWarnings` utility if changes were made
  - Verify component renders without React warnings
  - _Requirements: 1.5_
  - **Status**: ✅ Complete - Tests added in StepCard.test.tsx

- [x] 5. Fix SortableRepetitionBlockCard component
- [x] 5.1 Update SortableRepetitionBlockCard prop handling
  - Review how props are passed from SortableRepetitionBlockCard to RepetitionBlockCard
  - Ensure no component-specific props are included in spread
  - Verify attributes spreading is clean
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
  - **Status**: ✅ Complete - Props properly filtered

- [x] 5.2 Add warning detection test for SortableRepetitionBlockCard
  - Add unit test using `expectNoReactWarnings` utility
  - Verify component renders without React warnings
  - _Requirements: 1.5_
  - **Status**: ✅ Complete - Tests added in SortableRepetitionBlockCard.test.tsx

- [x] 6. Fix SortableStepCard component
- [x] 6.1 Update SortableStepCard prop handling
  - Review how props are passed from SortableStepCard to StepCard
  - Ensure no component-specific props are included in spread
  - Verify attributes spreading is clean
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
  - **Status**: ✅ Complete - Props properly filtered

- [x] 6.2 Add warning detection test for SortableStepCard
  - Add unit test using `expectNoReactWarnings` utility
  - Verify component renders without React warnings
  - _Requirements: 1.5_
  - **Status**: ✅ Complete - Tests added in SortableStepCard.test.tsx

- [x] 7. Checkpoint - Verify no warnings in development
  - Start development server
  - Navigate through all application features
  - Verify console shows zero React prop warnings
  - Test creating, editing, deleting blocks and steps
  - _Requirements: 1.5_
  - **Status**: ✅ Complete - Manual verification performed

- [x] 8. Run full test suite
  - Run all unit tests: `pnpm test`
  - Run all E2E tests: `pnpm test:e2e`
  - Verify all tests pass without modification
  - Verify no new warnings in test output
  - _Requirements: 3.4_
  - **Status**: ✅ Complete - All tests passing

- [x] 9. Update code style documentation
  - Add section to code-style.md about prop spreading
  - Document the correct pattern for handling component props
  - Add examples of DO and DON'T patterns
  - Include TypeScript type definition patterns
  - _Requirements: 2.1, 2.3_
  - **Status**: ✅ Complete - Documentation added to .kiro/steering/code-style.md

- [x] 10. Final verification
  - Review all changed files for consistency
  - Verify type safety is maintained (no TypeScript errors)
  - Verify no behavior changes (all tests pass)
  - Verify zero React warnings in console
  - _Requirements: 1.5, 3.1, 3.2, 3.3, 3.4_
  - **Status**: ✅ Complete - All verifications passed

## Summary

All tasks have been completed successfully. The implementation:

1. ✅ Created console spy utility for detecting React warnings
2. ✅ Fixed all affected components (RepetitionBlockCard, RepetitionBlockSteps, StepCard, SortableRepetitionBlockCard, SortableStepCard)
3. ✅ Added comprehensive warning detection tests for all components
4. ✅ Updated code style documentation with prop spreading patterns
5. ✅ Verified all existing tests continue to pass
6. ✅ Confirmed zero React prop warnings in console

The codebase now follows the correct pattern for prop spreading, with all component-specific props explicitly destructured before spreading HTML attributes to DOM elements.
