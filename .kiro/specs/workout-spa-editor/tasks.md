# Implementation Plan

This implementation plan prioritizes tasks by **impact** and **complexity** to deliver value quickly while building a solid foundation.

## Current Status: ⚠️ v1.0.0 (MVP) - Final Polish Needed

**Release Date:** TBD (pending P1c completion)  
**Status:** Feature Complete - E2E Test Fixes & Notifications Needed

### Implementation Summary

- ✅ **P0 Requirements (MVP):** 10/10 complete (100%)
- ✅ **P1 Requirements (Core):** 8/8 complete (100%)
- ✅ **P1b Quality Assurance:** 12/12 tasks complete (100%)
- ⚠️ **P1c Bug Fixes:** 0/9 tasks complete (0%) - **BLOCKING v1.0.0**
- ✅ **Test Coverage:** 86.54% (exceeds 70% target)
- ⚠️ **E2E Tests:** 54/95 passing (57%) - 41 tests failing
- ✅ **Unit Tests:** 417/417 passing (100%)
- ✅ **CI/CD Pipeline:** Core functionality passing
- ✅ **Documentation:** Complete (README, TESTING, ARCHITECTURE)

### Key Features Delivered

- ✅ Workout visualization with color-coded intensity
- ✅ Create, edit, delete, and duplicate workout steps
- ✅ Load and save KRD files with validation
- ✅ Undo/redo functionality (50-state history)
- ✅ Keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y) - **IMPLEMENTED**
- ✅ Mobile-responsive design (touch-friendly)
- ✅ Accessibility support (WCAG 2.1 AA compliant)
- ✅ Comprehensive testing (417 unit tests passing)
- ✅ Component documentation (Storybook)
- ✅ GitHub Pages deployment
- ✅ Theme system (light/dark/Kiroween)

### Known Issues to Fix (P1c)

- ⚠️ **41/95 E2E tests failing (57% passing)** - Timeout issues:
  - Workflow tests timing out (create, edit, save flows) - 8 tests
  - Smooth scrolling tests failing - 7 tests
  - Theme transition tests failing - 7 tests (strict mode violation)
  - Focus indicator tests timing out on webkit/mobile - 4 tests
  - Tablet layout tests timing out - 5 tests
  - Keyboard shortcut tests timing out - 7 tests (shortcuts ARE implemented)
  - Touch gesture tests failing - 3 tests
- ❌ **Success notifications not implemented** (TODO in SaveButton.tsx line 39)
  - @radix-ui/react-toast is installed but not integrated
  - Need Toast component, ToastProvider, and useToast hook
  - Need notifications for save, copy, delete actions

### Known Limitations (P2+ Features)

- ❌ Repetition blocks not yet supported (planned for v1.1.0)
- ❌ Drag-and-drop reordering not available (planned for v1.1.0)
- ❌ User profiles and workout library (planned for v1.2.0)
- ❌ Export to FIT/TCX/PWX formats (planned for v2.0.0)

## 📋 IMMEDIATE: P1c Bug Fixes & Polish (v1.0.0 Blockers)

**Critical fixes needed before v1.0.0 release:**

1. **Fix 41 failing E2E tests** (P1c.1) - Timeout issues in workflows, scrolling, themes, focus
2. **Implement success notifications** (P1c.2) - Toast system for save, copy, delete actions

**Estimated Effort:** 8-12 hours
**Priority:** HIGH - Blocking v1.0.0 release

## Priority Matrix

- **P0 (MVP)**: High impact + Low complexity - Core features for basic functionality ✅ **COMPLETE**
- **P1 (Core)**: High impact + Medium complexity - Essential features ✅ **COMPLETE**
- **P1b (QA)**: Quality assurance and polish ✅ **COMPLETE**
- **P1c (Fixes)**: Critical bug fixes ⚠️ **IN PROGRESS**
- **P2 (Enhanced)**: Medium impact + Low/Medium complexity - Nice-to-have features 📋 **PLANNED**
- **P3 (Advanced)**: Low impact or High complexity - Optional/future features 📋 **PLANNED**

## P1c: Critical Bug Fixes (v1.0.0 Release Blockers)

### P1c.1 Fix E2E Test Failures (41 failing tests)

**Summary:** 41/95 tests failing across all browsers (57% passing). Main issues:

1. ✅ Keyboard shortcuts implemented but tests timing out (30s) - 7 tests
2. ✅ Touch support enabled but some tests still failing - 3 tests
3. ❌ Workflow tests timing out (create, edit, save flows) - 8 tests
4. ❌ Smooth scrolling tests failing - 7 tests
5. ❌ Theme transition tests failing (strict mode violation) - 7 tests
6. ❌ Focus indicator tests timing out on webkit/mobile - 4 tests
7. ❌ Tablet layout tests timing out - 5 tests

**Status:** Most infrastructure is in place. Failures are primarily timeout issues in complex workflows and strict mode violations in theme tests, suggesting performance or selector problems rather than missing features.

- [ ] P1c.1.1 Fix workflow test timeouts (8 tests failing)
  - Tests timeout after 30s waiting for elements
  - Affects: workout-creation.spec.ts (create, duplicate, delete, undo/redo)
  - Affects: workout-load-edit-save.spec.ts (load, edit, save flow)
  - Debug: Check if elements are rendering, improve selectors
  - Consider: Add data-testid attributes for complex workflows
  - Consider: Increase timeout for complex workflows
  - _Requirements: 2, 3, 6, 7, 15, 16_
  - _Files: e2e/workout-creation.spec.ts, e2e/workout-load-edit-save.spec.ts_

- [ ] P1c.1.2 Fix smooth scrolling tests (7 tests failing)
  - Tests timeout waiting for smooth scroll behavior
  - Affects: mobile-responsive.spec.ts (scroll smoothly on mobile)
  - Debug: Verify scroll-behavior CSS property is applied
  - Consider: Adjust test expectations or implementation
  - Consider: Add explicit scroll completion check
  - _Requirements: 8_
  - _Files: e2e/mobile-responsive.spec.ts, index.css_

- [ ] P1c.1.3 Fix theme transition tests (7 tests failing)
  - Tests fail with strict mode violation: "Workout Editor" resolves to 2 elements
  - Affects: accessibility.spec.ts (smooth theme transitions)
  - Debug: Multiple "Workout Editor" headings in DOM (likely WelcomeSection + WorkoutSection)
  - Fix: Use more specific selector (getByRole with level) or ensure only one is visible
  - _Requirements: 13_
  - _Files: e2e/accessibility.spec.ts, components/pages/WelcomeSection.tsx, components/pages/WorkoutSection.tsx_

- [ ] P1c.1.4 Fix focus indicator tests on webkit/mobile (4 tests failing)
  - Tests timeout waiting for focus indicators
  - Affects: accessibility.spec.ts (visible focus indicators) on webkit/Mobile Safari
  - Debug: Verify focus-visible styles work on webkit
  - Consider: Webkit-specific focus styles or polyfill
  - Consider: Use explicit focus() calls in tests
  - _Requirements: 35_
  - _Files: e2e/accessibility.spec.ts, index.css_

- [ ] P1c.1.5 Fix tablet layout tests (5 tests failing)
  - Tests timeout waiting for tablet-specific layout
  - Affects: mobile-responsive.spec.ts (adapt layout for tablet)
  - Debug: Verify breakpoints and responsive classes
  - Consider: Add explicit tablet breakpoint styles
  - Consider: Add data-testid for tablet-specific elements
  - _Requirements: 8_
  - _Files: e2e/mobile-responsive.spec.ts, tailwind.config.js_

- [ ] P1c.1.6 Fix keyboard shortcut tests (7 tests failing)
  - Tests timeout waiting for keyboard shortcut actions
  - Keyboard shortcuts ARE implemented (useKeyboardShortcuts hook)
  - Debug: Verify shortcuts work in test environment
  - Consider: Add explicit wait for action completion
  - Consider: Check if keyboard events are properly dispatched in Playwright
  - _Requirements: 29_
  - _Files: e2e/accessibility.spec.ts, hooks/useKeyboardShortcuts.ts_

- [ ] P1c.1.7 Fix touch gesture tests (3 tests failing)
  - Tests timeout waiting for touch gesture responses
  - Affects: mobile-responsive.spec.ts (touch gestures for navigation)
  - Debug: Verify touch event handlers are registered
  - Consider: Add explicit touch event simulation
  - _Requirements: 8_
  - _Files: e2e/mobile-responsive.spec.ts_

### P1c.2 Implement Success Notifications

**Status:** @radix-ui/react-toast is already installed. Need to create components and integrate.

- [ ] P1c.2.1 Create Toast component system
  - Create Toast component in components/atoms/Toast/
  - Create ToastProvider wrapper component
  - Create useToast hook for easy access
  - Add ToastProvider to App.tsx root
  - Write unit tests for Toast component
  - Test toast rendering and auto-dismiss
  - _Requirements: 39_
  - _Files: components/atoms/Toast/Toast.tsx, components/atoms/Toast/ToastProvider.tsx, hooks/useToast.ts, App.tsx_

- [ ] P1c.2.2 Implement save success notification
  - Remove TODO comment from SaveButton.tsx (line 39)
  - Show success toast when workout saves successfully
  - Include workout name in notification
  - Write unit tests for save notification
  - Update E2E tests to verify notification appears
  - _Requirements: 39.1_
  - _Files: components/molecules/SaveButton/SaveButton.tsx, SaveButton.test.tsx_

## P2: Enhanced Features (v1.1.0 - Nice-to-Have)

**Target Release:** v1.1.0  
**Estimated Effort:** 20-30 hours  
**Priority:** MEDIUM - Enhances user experience

### P2.1 Repetition Blocks Support

**Status:** Not started. Core step functionality is complete, need to add repetition block support.

- [ ] P2.1.1 Create RepetitionBlock type and schema
  - Define RepetitionBlock type with repeatCount and steps array
  - Add Zod schema for validation
  - Update KRD type to support union of WorkoutStep | RepetitionBlock
  - Write unit tests for type guards
  - _Requirements: 4_
  - _Files: types/krd.ts, types/schemas.ts, types/krd-guards.ts_

- [ ] P2.1.2 Create RepetitionBlockCard component
  - Visual container showing repeat count and nested steps
  - Collapsible/expandable view of nested steps
  - Edit repeat count inline
  - Add/remove steps within block
  - Write unit tests for component
  - _Requirements: 4_
  - _Files: components/molecules/RepetitionBlockCard/RepetitionBlockCard.tsx_

- [ ] P2.1.3 Add "Create Repetition Block" action
  - Button to wrap selected steps in repetition block
  - Dialog to set repeat count
  - Update store actions to handle repetition blocks
  - Write unit tests for store actions
  - _Requirements: 4_
  - _Files: store/actions/create-repetition-block-action.ts, components/organisms/StepEditor/StepEditor.tsx_

- [ ] P2.1.4 Update workout stats to calculate repetition blocks
  - Calculate total duration including repetitions
  - Calculate total distance including repetitions
  - Update WorkoutStats component to display correctly
  - Write unit tests for calculations
  - _Requirements: 4, 5_
  - _Files: utils/workout-stats.ts, components/organisms/WorkoutStats/WorkoutStats.tsx_

- [ ] P2.1.5 Add E2E tests for repetition blocks
  - Test creating repetition block from steps
  - Test editing repeat count
  - Test adding/removing steps within block
  - Test stats calculation with repetitions
  - _Requirements: 4_
  - _Files: e2e/repetition-blocks.spec.ts_

### P2.2 Drag-and-Drop Reordering

**Status:** Not started. Need to add drag-and-drop library and implement reordering.

- [ ] P2.2.1 Install and configure drag-and-drop library
  - Install @dnd-kit/core and @dnd-kit/sortable
  - Configure DndContext in StepEditor
  - Add accessibility announcements for screen readers
  - _Requirements: 3_
  - _Files: package.json, components/organisms/StepEditor/StepEditor.tsx_

- [ ] P2.2.2 Make StepCard draggable
  - Add drag handle icon to StepCard
  - Implement useSortable hook
  - Add visual feedback during drag (opacity, transform)
  - Ensure touch support for mobile
  - Write unit tests for drag interactions
  - _Requirements: 3_
  - _Files: components/molecules/StepCard/StepCard.tsx_

- [ ] P2.2.3 Implement drop zones and reordering logic
  - Add drop zones between steps
  - Update store action to reorder steps
  - Add to undo/redo history
  - Handle edge cases (drag to same position, drag out of bounds)
  - Write unit tests for reordering logic
  - _Requirements: 3_
  - _Files: store/actions/reorder-steps-action.ts_

- [ ] P2.2.4 Add keyboard shortcuts for reordering
  - Alt+Up/Down to move step up/down
  - Update keyboard shortcuts hook
  - Add to help documentation
  - Write unit tests for keyboard reordering
  - _Requirements: 3, 29_
  - _Files: hooks/useKeyboardShortcuts.ts_

- [ ] P2.2.5 Add E2E tests for drag-and-drop
  - Test dragging step to new position
  - Test keyboard reordering
  - Test undo/redo after reordering
  - Test mobile touch drag
  - _Requirements: 3_
  - _Files: e2e/drag-and-drop.spec.ts_

### P2.3 Copy/Paste Step Functionality

**Status:** Not started. Need to implement clipboard operations.

- [ ] P2.3.1 Implement copy step to clipboard
  - Add "Copy" button to StepCard
  - Copy step data as JSON to clipboard
  - Show success notification
  - Write unit tests for copy action
  - _Requirements: 39.2_
  - _Files: components/molecules/StepCard/StepCard.tsx, store/actions/copy-step-action.ts_

- [ ] P2.3.2 Implement paste step from clipboard
  - Add "Paste" button to StepEditor
  - Read step data from clipboard
  - Validate clipboard data
  - Insert step at current position
  - Show success notification
  - Write unit tests for paste action
  - _Requirements: 39.2_
  - _Files: components/organisms/StepEditor/StepEditor.tsx, store/actions/paste-step-action.ts_

- [ ] P2.3.3 Add keyboard shortcuts for copy/paste
  - Ctrl+C to copy selected step
  - Ctrl+V to paste step
  - Update keyboard shortcuts hook
  - Write unit tests for keyboard copy/paste
  - _Requirements: 29, 39.2_
  - _Files: hooks/useKeyboardShortcuts.ts_

- [ ] P2.3.4 Add E2E tests for copy/paste
  - Test copying step
  - Test pasting step
  - Test keyboard shortcuts
  - Test notification appears
  - _Requirements: 39.2_
  - _Files: e2e/copy-paste.spec.ts_

### P2.4 Delete Confirmation with Undo

**Status:** Not started. Need to add undo notification for delete actions.

- [ ] P2.4.1 Add undo notification for delete
  - Show notification with "Undo" button for 5 seconds
  - Clicking "Undo" restores deleted step
  - Auto-dismiss after 5 seconds
  - Write unit tests for undo notification
  - _Requirements: 39.3_
  - _Files: components/molecules/StepCard/StepCard.tsx, hooks/useToast.ts_

- [ ] P2.4.2 Add E2E tests for delete with undo
  - Test deleting step shows notification
  - Test clicking "Undo" restores step
  - Test auto-dismiss after 5 seconds
  - _Requirements: 39.3_
  - _Files: e2e/delete-undo.spec.ts_

### P2.5 Enhanced Error Handling

**Status:** Not started. Need to improve error messages and recovery.

- [ ] P2.5.1 Add specific error messages for file parsing
  - Detect invalid JSON format
  - Detect missing required fields
  - Detect invalid field values
  - Show specific error location in file
  - Write unit tests for error detection
  - _Requirements: 36.4_
  - _Files: utils/save-workout.ts, types/validation.ts_

- [ ] P2.5.2 Add error recovery mechanisms
  - Restore previous state on error
  - Offer to download backup before risky operations
  - Add "Safe Mode" to disable advanced features
  - Write unit tests for recovery
  - _Requirements: 36.5_
  - _Files: store/workout-store.ts, hooks/useAppHandlers.ts_

- [ ] P2.5.3 Add loading states for async operations
  - Show spinner during file load
  - Show progress bar for large files
  - Disable UI during processing
  - Write unit tests for loading states
  - _Requirements: 36.3_
  - _Files: components/molecules/FileUpload/FileUpload.tsx_

## P3: Advanced Features (v1.2.0+ - Future)

**Target Release:** v1.2.0 and beyond  
**Estimated Effort:** 40-60 hours  
**Priority:** LOW - Optional enhancements

### P3.1 User Profiles and Zone Configuration

**Status:** Not started. Requires backend or local storage implementation.

- [ ] P3.1.1 Create Profile data model
  - Define Profile type with FTP, max HR, zones
  - Add Zod schema for validation
  - Create profile store with Zustand
  - Write unit tests for profile store
  - _Requirements: 9, 10, 11_
  - _Files: types/profile.ts, store/profile-store.ts_

- [ ] P3.1.2 Create ProfileManager component
  - List of saved profiles
  - Create/edit/delete profile
  - Set active profile
  - Import/export profile JSON
  - Write unit tests for component
  - _Requirements: 9, 38_
  - _Files: components/organisms/ProfileManager/ProfileManager.tsx_

- [ ] P3.1.3 Create ZoneEditor component
  - Visual editor for power/HR zones
  - Percentage-based or absolute values
  - Validate zone ranges
  - Preview zones in chart
  - Write unit tests for component
  - _Requirements: 10, 11_
  - _Files: components/organisms/ZoneEditor/ZoneEditor.tsx_

- [ ] P3.1.4 Integrate profiles with target picker
  - Show zone names in target picker
  - Calculate absolute values from zones
  - Update when profile changes
  - Write unit tests for integration
  - _Requirements: 10, 11_
  - _Files: components/molecules/TargetPicker/TargetPicker.tsx_

- [ ] P3.1.5 Add profile switching notification
  - Show notification when profile changes
  - Display active profile name
  - Write unit tests for notification
  - _Requirements: 39.4_
  - _Files: components/organisms/ProfileManager/ProfileManager.tsx_

- [ ] P3.1.6 Persist profiles to localStorage
  - Save profiles on change
  - Load profiles on app start
  - Handle storage quota errors
  - Write unit tests for persistence
  - _Requirements: 9_
  - _Files: utils/profile-storage.ts_

- [ ] P3.1.7 Add E2E tests for profiles
  - Test creating profile
  - Test editing zones
  - Test switching profiles
  - Test import/export
  - _Requirements: 9, 10, 11, 38_
  - _Files: e2e/profiles.spec.ts_

### P3.2 Workout Library and Templates

**Status:** Not started. Requires backend or local storage implementation.

- [ ] P3.2.1 Create WorkoutLibrary data model
  - Define WorkoutTemplate type
  - Add metadata (tags, difficulty, duration)
  - Create library store with Zustand
  - Write unit tests for library store
  - _Requirements: 17, 18_
  - _Files: types/workout-library.ts, store/library-store.ts_

- [ ] P3.2.2 Create WorkoutLibrary component
  - Grid view of saved workouts
  - Search and filter by tags
  - Sort by date, name, duration
  - Preview workout details
  - Write unit tests for component
  - _Requirements: 17, 18_
  - _Files: components/organisms/WorkoutLibrary/WorkoutLibrary.tsx_

- [ ] P3.2.3 Add save to library functionality
  - "Save to Library" button
  - Add tags and notes
  - Generate thumbnail preview
  - Write unit tests for save
  - _Requirements: 17_
  - _Files: components/molecules/SaveToLibraryButton/SaveToLibraryButton.tsx_

- [ ] P3.2.4 Add load from library functionality
  - Click workout to load
  - Confirm before replacing current workout
  - Add to recent workouts
  - Write unit tests for load
  - _Requirements: 18_
  - _Files: components/organisms/WorkoutLibrary/WorkoutLibrary.tsx_

- [ ] P3.2.5 Persist library to localStorage
  - Save library on change
  - Load library on app start
  - Handle storage quota errors
  - Write unit tests for persistence
  - _Requirements: 17_
  - _Files: utils/library-storage.ts_

- [ ] P3.2.6 Add E2E tests for library
  - Test saving workout to library
  - Test loading workout from library
  - Test search and filter
  - Test delete from library
  - _Requirements: 17, 18_
  - _Files: e2e/workout-library.spec.ts_

### P3.3 Export to FIT/TCX/PWX Formats

**Status:** Not started. Requires integration with @kaiord/core converters.

- [ ] P3.3.1 Add export format selector
  - Dropdown to select format (FIT, TCX, PWX, KRD)
  - Show format description
  - Validate workout before export
  - Write unit tests for selector
  - _Requirements: 19_
  - _Files: components/molecules/ExportFormatSelector/ExportFormatSelector.tsx_

- [ ] P3.3.2 Integrate @kaiord/core converters
  - Import fromKRD function from @kaiord/core
  - Handle conversion errors
  - Show progress during conversion
  - Write unit tests for integration
  - _Requirements: 19_
  - _Files: utils/export-workout.ts_

- [ ] P3.3.3 Update SaveButton to support multiple formats
  - Add format parameter to save function
  - Generate correct file extension
  - Update download filename
  - Write unit tests for multi-format save
  - _Requirements: 19_
  - _Files: components/molecules/SaveButton/SaveButton.tsx, utils/save-workout.ts_

- [ ] P3.3.4 Add E2E tests for export
  - Test exporting to FIT format
  - Test exporting to TCX format
  - Test exporting to PWX format
  - Test export error handling
  - _Requirements: 19_
  - _Files: e2e/export-formats.spec.ts_

### P3.4 Onboarding and Help System

**Status:** Not started. Requires tutorial component and help documentation.

- [ ] P3.4.1 Create OnboardingTutorial component
  - Step-by-step tutorial overlay
  - Highlight key UI elements
  - Skip or replay option
  - Save completion state to localStorage
  - Write unit tests for component
  - _Requirements: 37.1, 37.5_
  - _Files: components/organisms/OnboardingTutorial/OnboardingTutorial.tsx_

- [ ] P3.4.2 Add contextual tooltips
  - Tooltip component with Radix UI
  - Add tooltips to complex UI elements
  - Explain purpose and usage
  - Write unit tests for tooltips
  - _Requirements: 37.2_
  - _Files: components/atoms/Tooltip/Tooltip.tsx_

- [ ] P3.4.3 Create inline hints for first workout
  - Detect first-time user
  - Show hints during workout creation
  - Dismiss hints after completion
  - Write unit tests for hints
  - _Requirements: 37.3_
  - _Files: components/organisms/StepEditor/FirstTimeHints.tsx_

- [ ] P3.4.4 Create HelpSection component
  - Documentation with examples
  - Screenshots and GIFs
  - Keyboard shortcuts reference
  - FAQ section
  - Write unit tests for component
  - _Requirements: 37.4_
  - _Files: components/pages/HelpSection/HelpSection.tsx_

- [ ] P3.4.5 Add E2E tests for onboarding
  - Test tutorial appears for first-time user
  - Test skipping tutorial
  - Test replaying tutorial from settings
  - Test tooltips appear on hover
  - _Requirements: 37_
  - _Files: e2e/onboarding.spec.ts_

### P3.5 Advanced Workout Features

**Status:** Not started. Requires additional workout step types and features.

- [ ] P3.5.1 Add swimming-specific features
  - Pool length configuration
  - Stroke type selection
  - Drill equipment selection
  - Write unit tests for swimming features
  - _Requirements: 20, 21, 22_
  - _Files: components/molecules/SwimmingStepEditor/SwimmingStepEditor.tsx_

- [ ] P3.5.2 Add advanced duration types
  - Calorie-based duration
  - Power threshold duration
  - Heart rate threshold duration
  - Repeat until conditions
  - Write unit tests for duration types
  - _Requirements: 23, 24, 25, 26, 27, 28_
  - _Files: components/molecules/DurationPicker/AdvancedDurationPicker.tsx_

- [ ] P3.5.3 Add workout notes and coaching cues
  - Notes field for each step
  - Rich text editor for formatting
  - Character limit (256 chars)
  - Write unit tests for notes
  - _Requirements: 30_
  - _Files: components/molecules/StepNotesEditor/StepNotesEditor.tsx_

- [ ] P3.5.4 Add workout metadata editor
  - Edit workout name
  - Edit sport and sub-sport
  - Add workout description
  - Write unit tests for metadata editor
  - _Requirements: 1_
  - _Files: components/molecules/WorkoutMetadataEditor/WorkoutMetadataEditor.tsx_

### P3.6 Performance Optimization

**Status:** Not started. Requires profiling and optimization work.

- [ ] P3.6.1 Implement virtual scrolling for large workouts
  - Use react-window or react-virtual
  - Render only visible steps
  - Maintain scroll position
  - Write unit tests for virtual scrolling
  - _Requirements: Performance_
  - _Files: components/organisms/WorkoutList/VirtualWorkoutList.tsx_

- [ ] P3.6.2 Add service worker for offline support
  - Cache static assets
  - Cache workout files
  - Sync when online
  - Write unit tests for service worker
  - _Requirements: 31_
  - _Files: service-worker.ts_

- [ ] P3.6.3 Optimize bundle size
  - Code splitting by route
  - Lazy load heavy components
  - Tree-shake unused code
  - Analyze bundle with webpack-bundle-analyzer
  - _Requirements: Performance_
  - _Files: vite.config.ts_

- [ ] P3.6.4 Add performance monitoring
  - Track page load time
  - Track interaction latency
  - Track memory usage
  - Send metrics to analytics
  - _Requirements: Performance_
  - _Files: utils/performance-monitoring.ts_

### P3.7 Accessibility Enhancements

**Status:** Not started. Requires additional accessibility features.

- [ ] P3.7.1 Add screen reader announcements
  - Announce step creation/deletion
  - Announce undo/redo actions
  - Announce validation errors
  - Write unit tests for announcements
  - _Requirements: 35_
  - _Files: hooks/useScreenReaderAnnouncements.ts_

- [ ] P3.7.2 Add high contrast mode
  - High contrast color scheme
  - Increased border widths
  - Larger focus indicators
  - Write unit tests for high contrast mode
  - _Requirements: 35_
  - _Files: contexts/ThemeContext.tsx_

- [ ] P3.7.3 Add keyboard navigation improvements
  - Tab order optimization
  - Skip links for main content
  - Keyboard shortcuts help dialog
  - Write unit tests for keyboard navigation
  - _Requirements: 35_
  - _Files: components/atoms/SkipLink/SkipLink.tsx_

### P3.8 Testing and Quality Improvements

**Status:** Not started. Requires additional testing infrastructure.

- [ ] P3.8.1 Add visual regression testing
  - Set up Percy or Chromatic
  - Capture screenshots of all components
  - Compare against baseline
  - _Requirements: Testing_
  - _Files: .github/workflows/visual-regression.yml_

- [ ] P3.8.2 Add performance testing
  - Set up Lighthouse CI
  - Test page load performance
  - Test interaction performance
  - _Requirements: Testing_
  - _Files: .github/workflows/performance.yml_

- [ ] P3.8.3 Add cross-browser testing
  - Test on Safari, Firefox, Edge
  - Test on iOS Safari, Chrome Mobile
  - Test on different screen sizes
  - _Requirements: Testing_
  - _Files: playwright.config.ts_

- [ ] P3.8.4 Increase test coverage to 90%
  - Add missing unit tests
  - Add missing integration tests
  - Add missing E2E tests
  - _Requirements: Testing_
  - _Files: vitest.config.ts_

## Summary

This implementation plan provides a clear roadmap from MVP (v1.0.0) through enhanced features (v1.1.0) to advanced capabilities (v1.2.0+). Each task is:

- **Actionable**: Clear implementation steps
- **Testable**: Includes test requirements
- **Traceable**: References specific requirements
- **Incremental**: Builds on previous work

**Current Focus:** Complete P1c tasks to release v1.0.0, then proceed to P2 features for v1.1.
