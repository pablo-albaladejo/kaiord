# Requirements Document

## Introduction

This specification addresses React warnings about unrecognized props being passed to DOM elements. The issue occurs when component-specific props (event handlers, state values) are spread onto native HTML elements using `{...props}`, causing React to attempt passing them as DOM attributes.

## Glossary

- **DOM Element**: Native HTML elements (div, button, input, etc.)
- **Component Props**: React component properties that control behavior
- **DOM Attributes**: Valid HTML attributes that can be applied to DOM elements
- **Prop Spreading**: Using `{...props}` to pass multiple props at once
- **Rest Props**: Remaining props after destructuring specific ones

## Requirements

### Requirement 1

**User Story:** As a developer, I want to see no React warnings in the console, so that I can identify real issues and maintain code quality.

#### Acceptance Criteria

1. WHEN the application renders THEN the system SHALL NOT pass component-specific props to DOM elements
2. WHEN using prop spreading THEN the system SHALL filter out non-DOM props before spreading
3. WHEN a component receives event handler props THEN the system SHALL NOT pass them to DOM elements via spread operator
4. WHEN a component receives state props THEN the system SHALL NOT pass them to DOM elements via spread operator
5. WHEN the application runs THEN the system SHALL produce zero React prop warnings in the console

### Requirement 2

**User Story:** As a developer, I want a consistent pattern for handling props, so that the codebase is maintainable and follows best practices.

#### Acceptance Criteria

1. WHEN creating a component that spreads props THEN the system SHALL explicitly destructure all component-specific props
2. WHEN a component extends HTMLAttributes THEN the system SHALL only spread valid HTML attributes
3. WHEN defining component prop types THEN the system SHALL clearly separate component props from HTML attributes
4. WHEN using forwardRef THEN the system SHALL properly handle ref forwarding without prop conflicts

### Requirement 3

**User Story:** As a developer, I want type safety for component props, so that I catch prop-related errors at compile time.

#### Acceptance Criteria

1. WHEN defining component props THEN the system SHALL use TypeScript to enforce prop types
2. WHEN spreading props THEN the system SHALL maintain type safety for remaining props
3. WHEN a component receives invalid props THEN TypeScript SHALL show a compile-time error
4. WHEN refactoring prop handling THEN the system SHALL preserve all existing type definitions

## Affected Components

Based on the error messages, the following components are affected:

1. **RepetitionBlockCard** - Passes: `selectedStepId`, `selectedStepIds`, `onStepSelect`, `onToggleStepSelection`, `onStepDelete`, `onStepDuplicate`, `onStepCopy`, `onReorderStepsInBlock`, `onDuplicateStepInRepetitionBlock`, `onEditRepetitionBlock`, `onAddStepToRepetitionBlock`, `onUngroupRepetitionBlock`, `onDeleteRepetitionBlock`

2. **StepCard** (likely) - May have similar issues with step-specific props

3. **WorkoutList** (likely) - May be passing these props down to child components

## Technical Approach

The fix involves:

1. **Explicit Destructuring**: Extract all component-specific props explicitly
2. **Clean Rest Props**: Only spread props that are valid HTML attributes
3. **Type Safety**: Maintain TypeScript types throughout
4. **No Behavior Changes**: Fix should only affect prop handling, not functionality

## Success Criteria

- Zero React warnings about unrecognized props
- All existing tests continue to pass
- No changes to component behavior or appearance
- Type safety maintained throughout
- Code follows consistent pattern across all components
