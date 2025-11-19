# Requirements Document

## Introduction

This specification addresses critical bugs, accessibility gaps, type safety issues, and performance concerns identified during code review of PR #25 (Repetition Blocks and Error Handling). The fixes ensure the application meets quality standards for correctness, accessibility, type safety, and performance.

## Glossary

- **System**: The Workout SPA Editor application
- **Repetition Block**: A workout structure that groups multiple steps and repeats them a specified number of times
- **Keyboard Navigation**: The ability to interact with UI components using only keyboard inputs
- **Type Safety**: TypeScript's ability to catch type errors at compile time
- **NaN**: "Not a Number" - a special numeric value representing invalid number operations
- **Module Caching**: The behavior where imported modules are loaded once and cached for subsequent imports
- **O(n²) Complexity**: Algorithmic complexity where execution time grows quadratically with input size

## Requirements

### Requirement 1: Repetition Block Insertion Correctness

**User Story:** As a user creating interval workouts, I want repetition blocks to be inserted at the correct position, so that my workout structure remains logical and predictable.

#### Acceptance Criteria

1. WHEN a user creates a repetition block from selected steps THEN the system SHALL insert the block at the array position of the first selected step
2. WHEN repetition blocks already exist in the workout THEN the system SHALL calculate insertion position based on actual array index not step index
3. WHEN multiple repetition blocks are created sequentially THEN the system SHALL maintain correct ordering of all blocks and steps
4. WHEN steps are selected across existing repetition blocks THEN the system SHALL handle the selection correctly without index confusion
5. WHEN the insertion position is calculated THEN the system SHALL use O(1) lookup for selected indices using a Set data structure

### Requirement 2: Keyboard Accessibility for Dropdowns

**User Story:** As a keyboard user or screen reader user, I want to navigate and select dropdown options using only my keyboard, so that I can use the application without a mouse.

#### Acceptance Criteria

1. WHEN a dropdown is opened THEN the system SHALL move focus to the currently selected option or the first option
2. WHEN the user presses Arrow Down THEN the system SHALL move focus to the next option in the list
3. WHEN the user presses Arrow Up THEN the system SHALL move focus to the previous option in the list
4. WHEN the user presses Enter or Space on a focused option THEN the system SHALL select that option and close the dropdown
5. WHEN the user presses Escape THEN the system SHALL close the dropdown without changing the selection
6. WHEN an option receives focus THEN the system SHALL provide visual indication of the focused state
7. WHEN the dropdown is disabled THEN the system SHALL prevent all keyboard interactions

### Requirement 3: Number Parsing Validation

**User Story:** As a developer converting KRD to FIT format, I want all numeric parsing to validate for NaN, so that invalid data doesn't corrupt the FIT file.

#### Acceptance Criteria

1. WHEN the system parses serialNumber from metadata THEN the system SHALL validate the parsed value is not NaN before assignment
2. WHEN the parsed serialNumber is NaN THEN the system SHALL skip the assignment and leave the field undefined
3. WHEN the system parses product from metadata THEN the system SHALL use the same validation pattern as serialNumber
4. WHEN numeric parsing validation fails THEN the system SHALL not throw an error but silently skip the invalid value

### Requirement 4: Test Assertion Reliability

**User Story:** As a developer writing tests, I want assertions to always execute, so that test failures are not masked by optional chaining.

#### Acceptance Criteria

1. WHEN a test uses expect on a potentially undefined value THEN the system SHALL use explicit toBeDefined checks before property assertions
2. WHEN a test assertion uses optional chaining THEN the system SHALL remove the optional chaining to ensure the assertion executes
3. WHEN a value is undefined in a test THEN the system SHALL fail the test with a clear error message
4. WHEN property assertions are made THEN the system SHALL first verify the object exists with toBeDefined

### Requirement 5: Environment Detection Test Reliability

**User Story:** As a developer testing environment-specific code, I want tests to accurately simulate different environments, so that environment detection logic is verified correctly.

#### Acceptance Criteria

1. WHEN a test simulates a browser environment THEN the system SHALL reload the module to recompute the isBrowser flag
2. WHEN a test simulates a Node.js environment THEN the system SHALL reload the module to recompute the isBrowser flag
3. WHEN global.window is modified in a test THEN the system SHALL call vi.resetModules before importing the module
4. WHEN a module is dynamically imported in a test THEN the system SHALL use await import syntax to force fresh evaluation
5. WHEN a test completes THEN the system SHALL restore the original global.window value

### Requirement 6: Type Safety in Component Props

**User Story:** As a developer using TypeScript, I want component props to have correct types, so that type errors are caught at compile time.

#### Acceptance Criteria

1. WHEN a component receives a workout prop THEN the system SHALL type it as KRD not unknown
2. WHEN a component passes props to a function THEN the system SHALL not use never casts to bypass type checking
3. WHEN type mismatches occur THEN the system SHALL report TypeScript errors at compile time
4. WHEN a function expects specific types THEN the system SHALL ensure callers provide correctly typed arguments

### Requirement 7: JSON Parsing Performance

**User Story:** As a user loading large workout files, I want JSON parsing errors to be reported quickly, so that the application remains responsive.

#### Acceptance Criteria

1. WHEN JSON parsing fails THEN the system SHALL attempt to extract line and column from the error message using pattern matching
2. WHEN pattern matching fails to extract error location THEN the system SHALL return undefined for line and column
3. WHEN JSON parsing fails THEN the system SHALL not use character-by-character parsing fallback
4. WHEN error location is undefined THEN the system SHALL still provide a useful error message with the parsing error details
5. WHEN JSON parsing is performed THEN the system SHALL complete in O(n) time complexity where n is the file size

### Requirement 8: Documentation Clarity

**User Story:** As a code reviewer, I want test coverage documentation to clearly distinguish between implemented logic and pending UI work, so that I can accurately assess PR completeness.

#### Acceptance Criteria

1. WHEN test coverage is documented THEN the system SHALL include a top-level "Blocking UI Gaps" summary section
2. WHEN E2E tests require UI implementation THEN the system SHALL explicitly state the total count of blocked tests
3. WHEN requirements are marked as met THEN the system SHALL clarify whether logic is complete versus UI is complete
4. WHEN the conclusion is written THEN the system SHALL include an "Actual Status" section distinguishing logic from UI completion
5. WHEN UI work is deferred THEN the system SHALL explicitly state this in the documentation
