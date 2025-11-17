# Implementation Plan - Workout SPA Editor Advanced Features

This implementation plan covers advanced features for the Workout SPA Editor (v1.2.0 and beyond). These features extend the core MVP (v1.0.0) and enhanced features (v1.1.0) with user profiles, workout libraries, onboarding, advanced workout types, performance optimization, and accessibility enhancements.

## Priority Matrix

- **P1 (Core Advanced)**: High impact + Medium complexity - User profiles and workout library
- **P2 (Enhanced UX)**: Medium impact + Low/Medium complexity - Onboarding and help system
- **P3 (Optimization)**: Low impact or High complexity - Performance and accessibility enhancements

## P1: Core Advanced Features (v1.2.0)

**Target Release:** v1.2.0  
**Estimated Effort:** 25-35 hours  
**Priority:** MEDIUM - Valuable enhancements for power users

### P1.1 User Profiles and Zone Configuration

**Status:** Not started. Requires backend or local storage implementation.

**Testing Requirements:** All tasks must include comprehensive testing following the Testing Strategy:

- Unit tests for profile store and validation (80%+ coverage)
- Component tests for profile UI components (70%+ coverage)
- Integration tests for profile management workflows
- E2E tests for profile creation and switching
- Performance tests for profile persistence

- [ ] P1.1.1 Create Profile data model
  - Define Profile type with FTP, max HR, zones
  - Add Zod schema for validation
  - Create profile store with Zustand
  - Write unit tests for profile store
  - _Requirements: 9, 10, 11_
  - _Files: types/profile.ts, store/profile-store.ts_

- [ ] P1.1.2 Create ProfileManager component
  - List of saved profiles
  - Create/edit/delete profile
  - Set active profile
  - Import/export profile JSON
  - Write unit tests for component
  - _Requirements: 9, 38_
  - _Files: components/organisms/ProfileManager/ProfileManager.tsx_

- [ ] P1.1.3 Create ZoneEditor component
  - Visual editor for power/HR zones
  - Percentage-based or absolute values
  - Validate zone ranges
  - Preview zones in chart
  - Write unit tests for component
  - _Requirements: 10, 11_
  - _Files: components/organisms/ZoneEditor/ZoneEditor.tsx_

- [ ] P1.1.4 Integrate profiles with target picker
  - Show zone names in target picker
  - Calculate absolute values from zones
  - Update when profile changes
  - Write unit tests for integration
  - _Requirements: 10, 11_
  - _Files: components/molecules/TargetPicker/TargetPicker.tsx_

- [ ] P1.1.5 Add profile switching notification
  - Show notification when profile changes
  - Display active profile name
  - Write unit tests for notification
  - _Requirements: 39.4_
  - _Files: components/organisms/ProfileManager/ProfileManager.tsx_

- [ ] P1.1.6 Persist profiles to localStorage
  - Save profiles on change
  - Load profiles on app start
  - Handle storage quota errors
  - Write unit tests for persistence
  - _Requirements: 9_
  - _Files: utils/profile-storage.ts_

- [ ] P1.1.7 Implement comprehensive testing strategy for profiles
  - **Unit Tests** (Coverage target: 80%+)
    - Test profile store actions
    - Test profile validation
    - Test zone calculations
    - Test profile persistence
  - **Component Tests** (Coverage target: 70%+)
    - Test ProfileManager renders
    - Test ZoneEditor functionality
    - Test profile switching UI
    - Test import/export buttons
  - **Integration Tests**
    - Test complete profile creation flow
    - Test zone configuration workflow
    - Test profile switching with workout recalculation
  - **E2E Tests**
    - Test creating profile
    - Test editing zones
    - Test switching profiles
    - Test import/export profile
  - **Performance Tests**
    - Test profile switching performance
    - Test zone recalculation performance
  - _Requirements: 9, 10, 11, 38_
  - _Files: store/profile-store.test.ts, components/organisms/ProfileManager/ProfileManager.test.tsx, components/organisms/ZoneEditor/ZoneEditor.test.tsx, utils/profile-storage.test.ts, e2e/profiles.spec.ts_

### P1.2 Workout Library and Templates

**Status:** Not started. Requires backend or local storage implementation.

**Testing Requirements:** All tasks must include comprehensive testing following the Testing Strategy:

- Unit tests for library store and search (80%+ coverage)
- Component tests for library UI (70%+ coverage)
- Integration tests for save/load workflows
- E2E tests for library management
- Performance tests for large libraries (>100 workouts)

- [ ] P1.2.1 Create WorkoutLibrary data model
  - Define WorkoutTemplate type
  - Add metadata (tags, difficulty, duration)
  - Create library store with Zustand
  - Write unit tests for library store
  - _Requirements: 17, 18_
  - _Files: types/workout-library.ts, store/library-store.ts_

- [ ] P1.2.2 Create WorkoutLibrary component
  - Grid view of saved workouts
  - Search and filter by tags
  - Sort by date, name, duration
  - Preview workout details
  - Write unit tests for component
  - _Requirements: 17, 18_
  - _Files: components/organisms/WorkoutLibrary/WorkoutLibrary.tsx_

- [ ] P1.2.3 Add save to library functionality
  - "Save to Library" button
  - Add tags and notes
  - Generate thumbnail preview
  - Write unit tests for save
  - _Requirements: 17_
  - _Files: components/molecules/SaveToLibraryButton/SaveToLibraryButton.tsx_

- [ ] P1.2.4 Add load from library functionality
  - Click workout to load
  - Confirm before replacing current workout
  - Add to recent workouts
  - Write unit tests for load
  - _Requirements: 18_
  - _Files: components/organisms/WorkoutLibrary/WorkoutLibrary.tsx_

- [ ] P1.2.5 Persist library to localStorage
  - Save library on change
  - Load library on app start
  - Handle storage quota errors
  - Write unit tests for persistence
  - _Requirements: 17_
  - _Files: utils/library-storage.ts_

- [ ] P1.2.6 Implement comprehensive testing strategy for library
  - **Unit Tests** (Coverage target: 80%+)
    - Test library store actions
    - Test search and filter logic
    - Test library persistence
    - Test thumbnail generation
  - **Component Tests** (Coverage target: 70%+)
    - Test WorkoutLibrary renders
    - Test search functionality
    - Test filter functionality
    - Test save/load buttons
  - **Integration Tests**
    - Test complete save to library flow
    - Test complete load from library flow
    - Test search and filter workflow
  - **E2E Tests**
    - Test saving workout to library
    - Test loading workout from library
    - Test search and filter
    - Test delete from library
  - **Performance Tests**
    - Test library with >100 workouts
    - Test search performance
    - Test thumbnail rendering performance
  - _Requirements: 17, 18_
  - _Files: store/library-store.test.ts, components/organisms/WorkoutLibrary/WorkoutLibrary.test.tsx, utils/library-storage.test.ts, e2e/workout-library.spec.ts_

## P2: Enhanced UX Features (v1.3.0)

**Target Release:** v1.3.0  
**Estimated Effort:** 15-20 hours  
**Priority:** LOW - Nice-to-have UX improvements

### P2.1 Onboarding and Help System

**Status:** Not started. Requires tutorial component and help documentation.

**Testing Requirements:** All tasks must include comprehensive testing following the Testing Strategy:

- Unit tests for onboarding logic (80%+ coverage)
- Component tests for tutorial UI (70%+ coverage)
- Integration tests for onboarding workflows
- E2E tests for first-time user experience
- Accessibility tests for tooltips and help content

- [ ] P2.1.1 Create OnboardingTutorial component
  - Step-by-step tutorial overlay
  - Highlight key UI elements
  - Skip or replay option
  - Save completion state to localStorage
  - Write unit tests for component
  - _Requirements: 37.1, 37.5_
  - _Files: components/organisms/OnboardingTutorial/OnboardingTutorial.tsx_

- [ ] P2.1.2 Add contextual tooltips
  - Tooltip component with Radix UI
  - Add tooltips to complex UI elements
  - Explain purpose and usage
  - Write unit tests for tooltips
  - _Requirements: 37.2_
  - _Files: components/atoms/Tooltip/Tooltip.tsx_

- [ ] P2.1.3 Create inline hints for first workout
  - Detect first-time user
  - Show hints during workout creation
  - Dismiss hints after completion
  - Write unit tests for hints
  - _Requirements: 37.3_
  - _Files: components/organisms/StepEditor/FirstTimeHints.tsx_

- [ ] P2.1.4 Create HelpSection component
  - Documentation with examples
  - Screenshots and GIFs
  - Keyboard shortcuts reference
  - FAQ section
  - Write unit tests for component
  - _Requirements: 37.4_
  - _Files: components/pages/HelpSection/HelpSection.tsx_

- [ ] P2.1.5 Implement comprehensive testing strategy for onboarding
  - **Unit Tests** (Coverage target: 80%+)
    - Test tutorial state management
    - Test tooltip positioning logic
    - Test first-time user detection
  - **Component Tests** (Coverage target: 70%+)
    - Test OnboardingTutorial renders
    - Test tooltip interactions
    - Test hint dismissal
  - **Integration Tests**
    - Test complete onboarding flow
    - Test tutorial replay from settings
  - **E2E Tests**
    - Test tutorial appears for first-time user
    - Test skipping tutorial
    - Test replaying tutorial from settings
    - Test tooltips appear on hover
  - **Accessibility Tests**
    - Test keyboard navigation in tutorial
    - Test screen reader announcements
  - _Requirements: 37_
  - _Files: components/organisms/OnboardingTutorial/OnboardingTutorial.test.tsx, components/atoms/Tooltip/Tooltip.test.tsx, e2e/onboarding.spec.ts_

### P2.2 Advanced Workout Features

**Status:** Not started. Requires additional workout step types and features.

**Testing Requirements:** All tasks must include comprehensive testing following the Testing Strategy:

- Unit tests for advanced duration/target logic (80%+ coverage)
- Component tests for swimming and notes UI (70%+ coverage)
- Integration tests for advanced workout creation
- E2E tests for swimming workouts
- Performance tests for rich text editor

- [ ] P2.2.1 Add swimming-specific features
  - Pool length configuration
  - Stroke type selection
  - Drill equipment selection
  - Write unit tests for swimming features
  - _Requirements: 20, 21, 22_
  - _Files: components/molecules/SwimmingStepEditor/SwimmingStepEditor.tsx_

- [ ] P2.2.2 Add advanced duration types
  - Calorie-based duration
  - Power threshold duration
  - Heart rate threshold duration
  - Repeat until conditions
  - Write unit tests for duration types
  - _Requirements: 23, 24, 25, 26, 27, 28_
  - _Files: components/molecules/DurationPicker/AdvancedDurationPicker.tsx_

- [ ] P2.2.3 Add workout notes and coaching cues
  - Notes field for each step
  - Rich text editor for formatting
  - Character limit (256 chars)
  - Write unit tests for notes
  - _Requirements: 30_
  - _Files: components/molecules/StepNotesEditor/StepNotesEditor.tsx_

- [ ] P2.2.4 Add workout metadata editor
  - Edit workout name
  - Edit sport and sub-sport
  - Add workout description
  - Write unit tests for metadata editor
  - _Requirements: 1_
  - _Files: components/molecules/WorkoutMetadataEditor/WorkoutMetadataEditor.tsx_

- [ ] P2.2.5 Implement comprehensive testing strategy for advanced features
  - **Unit Tests** (Coverage target: 80%+)
    - Test swimming calculations (laps, strokes)
    - Test advanced duration logic
    - Test notes validation
  - **Component Tests** (Coverage target: 70%+)
    - Test SwimmingStepEditor renders
    - Test AdvancedDurationPicker functionality
    - Test StepNotesEditor character limit
  - **Integration Tests**
    - Test creating swimming workout
    - Test advanced duration workflows
  - **E2E Tests**
    - Test swimming workout creation
    - Test advanced duration types
    - Test adding notes to steps
  - **Performance Tests**
    - Test rich text editor performance
  - _Requirements: 1, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30_
  - _Files: components/molecules/SwimmingStepEditor/SwimmingStepEditor.test.tsx, components/molecules/DurationPicker/AdvancedDurationPicker.test.tsx, components/molecules/StepNotesEditor/StepNotesEditor.test.tsx, e2e/advanced-workouts.spec.ts_

## P3: Optimization Features (v1.4.0+)

**Target Release:** v1.4.0 and beyond  
**Estimated Effort:** 20-30 hours  
**Priority:** LOW - Performance and quality enhancements

### P3.1 Performance Optimization

**Status:** Not started. Requires profiling and optimization work.

**Testing Requirements:** All tasks must include comprehensive testing following the Testing Strategy:

- Unit tests for optimization utilities (80%+ coverage)
- Component tests for virtual scrolling (70%+ coverage)
- Integration tests for service worker
- E2E tests for offline functionality
- Performance benchmarks for all optimizations

- [ ] P3.1.1 Implement virtual scrolling for large workouts
  - Use react-window or react-virtual
  - Render only visible steps
  - Maintain scroll position
  - Write unit tests for virtual scrolling
  - _Requirements: Performance_
  - _Files: components/organisms/WorkoutList/VirtualWorkoutList.tsx_

- [ ] P3.1.2 Add service worker for offline support
  - Cache static assets
  - Cache workout files
  - Sync when online
  - Write unit tests for service worker
  - _Requirements: 31_
  - _Files: service-worker.ts_

- [ ] P3.1.3 Optimize bundle size
  - Code splitting by route
  - Lazy load heavy components
  - Tree-shake unused code
  - Analyze bundle with webpack-bundle-analyzer
  - _Requirements: Performance_
  - _Files: vite.config.ts_

- [ ] P3.1.4 Add performance monitoring
  - Track page load time
  - Track interaction latency
  - Track memory usage
  - Send metrics to analytics
  - _Requirements: Performance_
  - _Files: utils/performance-monitoring.ts_

- [ ] P3.1.5 Implement comprehensive testing strategy for performance
  - **Unit Tests** (Coverage target: 80%+)
    - Test virtual scrolling calculations
    - Test service worker cache logic
  - **Component Tests** (Coverage target: 70%+)
    - Test VirtualWorkoutList renders
  - **Integration Tests**
    - Test service worker registration
    - Test offline sync
  - **E2E Tests**
    - Test offline functionality
    - Test cache updates
  - **Performance Tests**
    - Benchmark virtual scrolling with >100 steps
    - Benchmark bundle size
    - Benchmark page load time
    - Benchmark memory usage
  - _Requirements: 31, Performance_
  - _Files: components/organisms/WorkoutList/VirtualWorkoutList.test.tsx, service-worker.test.ts, e2e/offline.spec.ts, .github/workflows/performance.yml_

### P3.2 Accessibility Enhancements

**Status:** Not started. Requires additional accessibility features.

**Testing Requirements:** All tasks must include comprehensive testing following the Testing Strategy:

- Unit tests for accessibility utilities (80%+ coverage)
- Component tests for accessibility features (70%+ coverage)
- Integration tests for keyboard navigation
- E2E tests for screen reader compatibility
- WCAG 2.1 AAA compliance validation

- [ ] P3.2.1 Add screen reader announcements
  - Announce step creation/deletion
  - Announce undo/redo actions
  - Announce validation errors
  - Write unit tests for announcements
  - _Requirements: 35_
  - _Files: hooks/useScreenReaderAnnouncements.ts_

- [ ] P3.2.2 Add high contrast mode
  - High contrast color scheme
  - Increased border widths
  - Larger focus indicators
  - Write unit tests for high contrast mode
  - _Requirements: 35_
  - _Files: contexts/ThemeContext.tsx_

- [ ] P3.2.3 Add keyboard navigation improvements
  - Tab order optimization
  - Skip links for main content
  - Keyboard shortcuts help dialog
  - Write unit tests for keyboard navigation
  - _Requirements: 35_
  - _Files: components/atoms/SkipLink/SkipLink.tsx_

- [ ] P3.2.4 Implement comprehensive testing strategy for accessibility
  - **Unit Tests** (Coverage target: 80%+)
    - Test screen reader announcement logic
    - Test high contrast color calculations
    - Test keyboard navigation utilities
  - **Component Tests** (Coverage target: 70%+)
    - Test SkipLink renders
    - Test high contrast mode toggle
  - **Integration Tests**
    - Test complete keyboard navigation flow
    - Test screen reader announcements
  - **E2E Tests**
    - Test keyboard-only navigation
    - Test screen reader compatibility
    - Test high contrast mode
  - **Accessibility Tests**
    - Validate WCAG 2.1 AAA compliance
    - Test with axe-core
  - _Requirements: 35_
  - _Files: hooks/useScreenReaderAnnouncements.test.ts, contexts/ThemeContext.test.tsx, components/atoms/SkipLink/SkipLink.test.tsx, e2e/accessibility-advanced.spec.ts_

### P3.3 Testing and Quality Improvements

**Status:** Not started. Requires additional testing infrastructure.

**Testing Requirements:** All tasks must include comprehensive testing following the Testing Strategy:

- Visual regression tests for all components
- Performance tests for all critical paths
- Cross-browser tests on all major browsers
- Increase overall coverage to 90%+

- [ ] P3.3.1 Add visual regression testing
  - Set up Percy or Chromatic
  - Capture screenshots of all components
  - Compare against baseline
  - _Requirements: Testing_
  - _Files: .github/workflows/visual-regression.yml_

- [ ] P3.3.2 Add performance testing
  - Set up Lighthouse CI
  - Test page load performance
  - Test interaction performance
  - _Requirements: Testing_
  - _Files: .github/workflows/performance.yml_

- [ ] P3.3.3 Add cross-browser testing
  - Test on Safari, Firefox, Edge
  - Test on iOS Safari, Chrome Mobile
  - Test on different screen sizes
  - _Requirements: Testing_
  - _Files: playwright.config.ts_

- [ ] P3.3.4 Increase test coverage to 90%
  - Add missing unit tests
  - Add missing integration tests
  - Add missing E2E tests
  - _Requirements: Testing_
  - _Files: vitest.config.ts_

## Summary

This implementation plan provides a clear roadmap for advanced features (v1.2.0+) that extend the Workout SPA Editor with powerful functionality for power users. Each task is:

- **Actionable**: Clear implementation steps
- **Testable**: Includes comprehensive test requirements
- **Traceable**: References specific requirements
- **Incremental**: Builds on core and enhanced features

**Recommended Approach:** Implement P1 features first (profiles and library) as they provide the most value to users, then proceed to P2 (onboarding and advanced workouts) and P3 (optimization) as time and resources allow.
