# Implementation Plan

This implementation plan prioritizes tasks by **impact** and **complexity** to deliver value quickly while building a solid foundation.

## Priority Matrix

- **P0 (MVP)**: High impact + Low complexity - Core features for basic functionality
- **P1 (Core)**: High impact + Medium complexity - Essential features
- **P2 (Enhanced)**: Medium impact + Low/Medium complexity - Nice-to-have features
- **P3 (Advanced)**: Low impact or High complexity - Optional/future features

## P0: MVP Foundation

### P0.1 Project Setup and Infrastructure

- [x] P0.1.1 Initialize Vite + React + TypeScript project
  - Create project with `npm create vite@latest`
  - Configure TypeScript strict mode
  - Set up ESLint and Prettier
  - _Requirements: 33_

- [x] P0.1.2 Install and configure core dependencies
  - Install Zustand, Zod, Tailwind CSS, Radix UI
  - Configure Tailwind with base theme
  - Set up path aliases (@/ for src/)
  - _Requirements: 33_

- [x] P0.1.3 Set up project structure
  - Create folder structure (components/atoms, molecules, organisms, pages, hooks, store, types)
  - Create barrel exports for clean imports
  - Set up absolute imports
  - _Requirements: 33_

- [x] P0.1.4 Configure GitHub Pages deployment
  - Create GitHub Actions workflow for build and deploy
  - Configure base path for GitHub Pages
  - Set up environment variables
  - _Requirements: 33_

### P0.2 Core Domain Types and Validation

- [x] P0.2.1 Define KRD types from @kaiord/core
  - ✅ Import and re-export KRD types from @kaiord/core package
  - ✅ Create type guards for WorkoutStep vs RepetitionBlock
  - ✅ Define helper types for UI state
  - _Requirements: 1, 2, 3_
  - _Note: @kaiord/core dependency added to package.json_

- [x] P0.2.2 Create Zod schemas for validation
  - ✅ Re-export schemas from @kaiord/core (workoutSchema, workoutStepSchema, etc.)
  - ✅ Add UI-specific schemas (WorkoutLibraryItemSchema, UserProfileSchema)
  - ✅ Create validation error formatters
  - _Requirements: 6, 7, 17_

### P0.3 Basic State Management

- [x] P0.3.1 Create Zustand store for workout state
  - Define store interface with workout, selectedStepId, isEditing
  - Implement loadWorkout, updateWorkout actions
  - Implement selectStep action
  - _Requirements: 1, 2, 3_

- [x] P0.3.2 Implement undo/redo functionality
  - Add workoutHistory and historyIndex to store
  - Implement undo() and redo() actions
  - Limit history to 50 states
  - _Requirements: 15_

### P0.4 Basic UI Components (Atoms)

- [x] P0.4.1 Create Button component
  - Implement variants (primary, secondary, ghost, danger)
  - Add size variants (sm, md, lg)
  - Add loading and disabled states
  - _Requirements: 2, 3, 5_

- [x] P0.4.2 Create Input component
  - Implement text, number, select variants
  - Add error state styling
  - Add label and helper text support
  - _Requirements: 2, 3, 17_

- [x] P0.4.3 Create Badge component
  - Implement color variants for intensity levels
  - Add size variants
  - Support icons
  - _Requirements: 1, 10_

- [x] P0.4.4 Create Icon component
  - Set up icon library (lucide-react)
  - Create icon wrapper with size variants
  - Add color support
  - _Requirements: 10_

### P0.5 Workout Visualization (MVP)

- [x] P0.5.1 Create StepCard molecule
  - Display step index, duration, target, intensity
  - Show color coding by intensity
  - Add icons for target types
  - _Requirements: 1, 10_

- [x] P0.5.2 Create WorkoutList organism
  - Render list of StepCard components
  - Handle step selection
  - Display repetition blocks visually grouped
  - _Requirements: 1_

- [x] P0.5.3 Create basic page layout
  - Create MainLayout template with header and content area
  - Add app title and basic navigation
  - Make responsive for mobile
  - _Requirements: 1, 8_

### P0.6 File Loading (MVP)

- [x] P0.6.1 Implement file upload functionality
  - Create file input component
  - Parse JSON file content
  - Validate against KRD schema
  - _Requirements: 7_

- [x] P0.6.2 Handle file loading errors
  - Display validation errors with field references
  - Show user-friendly error messages
  - Add retry functionality
  - _Requirements: 7, 36_

- [x] P0.6.3 Load workout into state
  - Parse KRD file
  - Load into Zustand store
  - Display in WorkoutList
  - _Requirements: 1, 7_

## P1: Core Editing Features

### P1.7 Step Editing

- [x] P1.7.1 Create DurationPicker molecule
  - Support time, distance, open duration types
  - Add input validation
  - Show real-time validation errors
  - _Requirements: 2, 3, 17_

- [x] P1.7.2 Create TargetPicker molecule
  - Support power, heart_rate, pace, cadence, open targets
  - Dynamic unit selection (zone, watts, bpm, range)
  - Add input validation
  - _Requirements: 2, 3, 17_

- [x] P1.7.3 Create StepEditor organism
  - Form for editing step properties
  - Include DurationPicker and TargetPicker
  - Add save and cancel buttons
  - _Requirements: 3_

- [ ] P1.7.4 Implement step editing flow
  - Open StepEditor on step selection in WorkoutSection
  - Update workout state on save via store actions
  - Revert changes on cancel
  - Close editor after save/cancel
  - _Requirements: 3_

### P1.8 Step Management

- [ ] P1.8.1 Implement step creation
  - Add "New Step" button to WorkoutSection
  - Create step with default values (open duration, open target)
  - Add createStep action to workout store
  - Insert at end of workout.steps array
  - Recalculate stepIndex for all steps
  - _Requirements: 2_

- [ ] P1.8.2 Implement step deletion
  - Add delete button to StepCard
  - Show confirmation dialog using Radix Dialog
  - Add deleteStep action to workout store
  - Remove step from workout.steps array
  - Recalculate stepIndex for all subsequent steps
  - Handle deletion within repetition blocks
  - _Requirements: 5_

- [ ] P1.8.3 Implement step duplication
  - Add duplicate button to StepCard
  - Add duplicateStep action to workout store
  - Create exact copy of step with new stepIndex
  - Insert after original step in workout.steps array
  - Recalculate stepIndex for all subsequent steps
  - _Requirements: 16_

### P1.9 File Saving

- [x] P1.9.1 Implement workout save functionality
  - Validate workout against KRD schema
  - Generate JSON file
  - Trigger browser download
  - _Requirements: 6_

- [x] P1.9.2 Handle save errors
  - Display validation errors
  - Show user-friendly messages
  - Allow fixing errors before retry
  - _Requirements: 6, 36_

### P1.10 Workout Statistics

- [x] P1.10.1 Create WorkoutStats organism
  - Calculate total duration
  - Calculate total distance
  - Handle repetition blocks in calculations
  - _Requirements: 9_

- [x] P1.10.2 Display statistics in UI
  - Add stats panel to layout
  - Update in real-time on workout changes
  - Show estimates for open-ended steps
  - _Requirements: 9_

## P2: Enhanced Features

### P2.11 Drag and Drop Reordering

- [ ] P2.11.1 Install and configure @dnd-kit
  - Set up DndContext
  - Configure sensors for mouse and touch
  - Add collision detection
  - _Requirements: 4_

- [ ] P2.11.2 Make WorkoutList draggable
  - Wrap StepCard in draggable component
  - Add drag handle
  - Show visual feedback during drag
  - _Requirements: 4_

- [ ] P2.11.3 Implement drop logic
  - Handle step reordering
  - Recalculate step indices
  - Update workout state
  - _Requirements: 4_

### P2.12 User Profiles

- [ ] P2.12.1 Create UserProfile types and schemas
  - Define profile interface with zones
  - Create Zod schemas for validation
  - Add default zone configurations
  - _Requirements: 30_

- [ ] P2.12.2 Create ProfileForm organism
  - Form for name, weight, FTP, max HR
  - Zone configuration inputs
  - Save and cancel buttons
  - _Requirements: 30_

- [ ] P2.12.3 Implement profile storage
  - Save profiles to IndexedDB using Dexie
  - Load profiles on app init
  - Handle storage errors
  - _Requirements: 30, 32_

- [ ] P2.12.4 Create profile selector
  - Dropdown to switch between profiles
  - Show active profile indicator
  - Add "New Profile" option
  - _Requirements: 31_

### P2.13 Workout Library

- [ ] P2.13.1 Create WorkoutLibrary types
  - Define WorkoutLibraryItem interface
  - Add metadata (tags, dates)
  - Create Zod schemas
  - _Requirements: 21_

- [ ] P2.13.2 Implement library storage
  - Save workouts to IndexedDB
  - Load library on app init
  - Handle storage quota exceeded
  - _Requirements: 21_

- [ ] P2.13.3 Create WorkoutLibrary UI
  - List view of saved workouts
  - Search and filter functionality
  - Load, delete, duplicate actions
  - _Requirements: 21_

### P2.14 Theme System

- [ ] P2.14.1 Implement theme provider
  - Create ThemeContext with light/dark themes
  - Detect system preference
  - Persist theme choice in localStorage
  - _Requirements: 13_

- [ ] P2.14.2 Create theme toggle UI
  - Add theme switcher button
  - Show current theme icon
  - Smooth transition between themes
  - _Requirements: 13_

- [ ] P2.14.3 Implement Kiroween theme
  - Add Kiroween color palette
  - Create ghost decoration components
  - Add feature flag for easy removal
  - _Requirements: 13_

### P2.15 Copy/Paste Functionality

- [ ] P2.15.1 Implement copy to clipboard
  - Add copy button to StepCard
  - Store step data in Zustand clipboard state
  - Show confirmation notification
  - _Requirements: 20_

- [ ] P2.15.2 Implement paste from clipboard
  - Add paste button to UI
  - Insert copied step at cursor position
  - Recalculate step indices
  - _Requirements: 20_

### P2.16 Keyboard Shortcuts

- [ ] P2.16.1 Implement global keyboard shortcuts
  - Ctrl/Cmd+Z for undo
  - Ctrl/Cmd+Y for redo
  - Ctrl/Cmd+S for save
  - _Requirements: 29_

- [ ] P2.16.2 Implement context-specific shortcuts
  - Ctrl/Cmd+D for duplicate (when step selected)
  - Delete for delete (when step selected)
  - Escape to cancel editing
  - _Requirements: 29_

## P3: Advanced Features

### P3.17 Workout Templates

- [ ] P3.17.1 Create template types and data
  - Define WorkoutTemplate interface
  - Create 5 predefined templates (intervals, pyramid, threshold, recovery, endurance)
  - Add template metadata
  - _Requirements: 11_

- [ ] P3.17.2 Create TemplateLibrary UI
  - Grid view of templates
  - Template preview
  - Apply template button
  - _Requirements: 11_

- [ ] P3.17.3 Implement custom templates
  - Save current workout as template
  - Store in IndexedDB
  - Edit and delete custom templates
  - _Requirements: 11_

### P3.18 Export to FIT/TCX/PWX

- [ ] P3.18.1 Integrate @kaiord/core conversion
  - Import conversion functions
  - Handle async conversion
  - Manage conversion errors
  - _Requirements: 12_

- [ ] P3.18.2 Create export UI
  - Format selector (FIT, TCX, PWX)
  - Export button
  - Show conversion progress
  - _Requirements: 12_

- [ ] P3.18.3 Trigger file download
  - Generate file with correct extension
  - Use workout name as filename
  - Show success notification
  - _Requirements: 12_

### P3.19 Workout Chart Visualization

- [ ] P3.19.1 Install and configure Recharts
  - Set up chart components
  - Configure responsive container
  - Style charts for themes
  - _Requirements: 18_

- [ ] P3.19.2 Create WorkoutChart organism
  - Plot intensity/power over time
  - Handle time-based and distance-based workouts
  - Show repetition blocks
  - _Requirements: 18_

- [ ] P3.19.3 Add chart interactivity
  - Hover tooltips with step details
  - Click to select step
  - Highlight selected step
  - _Requirements: 18_

### P3.20 Search and Filter

- [ ] P3.20.1 Create SearchBar molecule
  - Text input for search
  - Clear button
  - Debounced search
  - _Requirements: 19_

- [ ] P3.20.2 Implement search logic
  - Filter steps by name
  - Highlight matching steps
  - Show "no results" message
  - _Requirements: 19_

- [ ] P3.20.3 Add filter controls
  - Filter by target type
  - Filter by intensity
  - Combine with search
  - _Requirements: 19_

### P3.21 Internationalization

- [ ] P3.21.1 Set up react-i18next
  - Install and configure i18next
  - Create translation files for 5 languages
  - Set up language detection
  - _Requirements: 14_

- [ ] P3.21.2 Translate UI strings
  - Extract all hardcoded strings
  - Add translation keys
  - Implement useTranslation hook
  - _Requirements: 14_

- [ ] P3.21.3 Add language selector
  - Dropdown with language options
  - Persist language choice
  - Update on selection
  - _Requirements: 14_

- [ ] P3.21.4 Implement locale formatting
  - Format numbers by locale
  - Format dates by locale
  - Handle pluralization
  - _Requirements: 14_

### P3.22 Advanced Calculations

- [ ] P3.22.1 Implement TSS/IF calculator
  - Calculate Training Stress Score
  - Calculate Intensity Factor
  - Use profile FTP for calculations
  - _Requirements: 24_

- [ ] P3.22.2 Implement calorie estimator
  - Calculate based on power data
  - Calculate based on heart rate data
  - Use profile body weight
  - _Requirements: 25_

- [ ] P3.22.3 Display calculations in UI
  - Add to WorkoutStats component
  - Show when profile data available
  - Update in real-time
  - _Requirements: 24, 25_

### P3.23 Unit System

- [ ] P3.23.1 Implement unit conversion utilities
  - Metric to imperial conversions
  - Imperial to metric conversions
  - Handle distance, speed, weight
  - _Requirements: 26_

- [ ] P3.23.2 Add unit system selector
  - Toggle between metric/imperial
  - Persist preference
  - Update all displays
  - _Requirements: 26_

### P3.24 Swimming-Specific Features

- [ ] P3.24.1 Add pool configuration
  - Pool length selector (25m, 50m, 25yd, custom)
  - Show when sport is swimming
  - Persist with workout
  - _Requirements: 27_

- [ ] P3.24.2 Add swim stroke selector
  - Dropdown with stroke types
  - Show in StepEditor for swimming
  - Display in StepCard
  - _Requirements: 27_

- [ ] P3.24.3 Add equipment selector
  - Multi-select for equipment
  - Show in StepEditor for swimming
  - Display in StepCard
  - _Requirements: 27_

- [ ] P3.24.4 Implement lap counter
  - Calculate laps from distance and pool length
  - Display in StepCard
  - Show total laps in WorkoutStats
  - _Requirements: 28_

### P3.25 Import from URL

- [ ] P3.25.1 Create URL import UI
  - Input field for URL
  - Import button
  - Loading state
  - _Requirements: 22_

- [ ] P3.25.2 Implement fetch and parse
  - Fetch content from URL
  - Parse as JSON
  - Validate as KRD
  - _Requirements: 22_

- [ ] P3.25.3 Handle import errors
  - Network errors
  - Invalid JSON
  - Invalid KRD
  - _Requirements: 22, 36_

### P3.26 Workout Sharing

- [ ] P3.26.1 Implement share link generation
  - Encode workout data in URL
  - Generate shareable link
  - Copy to clipboard
  - _Requirements: 23_

- [ ] P3.26.2 Implement share code generation
  - Generate short alphanumeric code (6-8 chars)
  - Store workout with code (future backend)
  - Copy code to clipboard
  - _Requirements: 23_

- [ ] P3.26.3 Implement share code import
  - Input field for share code
  - Retrieve workout (future backend)
  - Load into editor
  - _Requirements: 23_

### P3.27 Profile Import/Export

- [ ] P3.27.1 Implement profile export
  - Generate JSON with all profile data
  - Trigger file download
  - Show success notification
  - _Requirements: 38_

- [ ] P3.27.2 Implement profile import
  - File input for profile JSON
  - Validate profile data
  - Add to profile list
  - _Requirements: 38_

### P3.28 Notifications System

- [ ] P3.28.1 Create Toast/Snackbar component
  - Success, error, warning, info variants
  - Auto-dismiss after timeout
  - Manual dismiss button
  - _Requirements: 39_

- [ ] P3.28.2 Implement notification manager
  - Queue for multiple notifications
  - Position configuration
  - Animation transitions
  - _Requirements: 39_

- [ ] P3.28.3 Add notifications throughout app
  - Save success
  - Copy confirmation
  - Delete with undo
  - Profile switch
  - _Requirements: 39_

### P3.29 Onboarding and Help

- [ ] P3.29.1 Create onboarding tutorial
  - Welcome screen
  - Feature highlights
  - Interactive walkthrough
  - Skip option
  - _Requirements: 37_

- [ ] P3.29.2 Add contextual tooltips
  - Tooltip component
  - Add to complex UI elements
  - Keyboard shortcut hints
  - _Requirements: 37_

- [ ] P3.29.3 Create help documentation
  - Help page with sections
  - Examples and screenshots
  - FAQ section
  - _Requirements: 37_

### P3.30 PWA Features

- [ ] P3.30.1 Configure Vite PWA plugin
  - Install vite-plugin-pwa
  - Configure manifest.json
  - Set up service worker
  - _Requirements: 34_

- [ ] P3.30.2 Implement offline functionality
  - Cache static assets
  - Cache workout data
  - Queue offline changes
  - _Requirements: 34_

- [ ] P3.30.3 Add update notification
  - Detect new version
  - Show update prompt
  - Reload to update
  - _Requirements: 34_

### P3.31 Accessibility Enhancements

- [ ] P3.31.1 Add ARIA labels and roles
  - Label all interactive elements
  - Add proper roles
  - Implement focus management
  - _Requirements: 35_

- [ ] P3.31.2 Ensure color contrast
  - Audit all color combinations
  - Fix contrast issues
  - Test with color blindness simulators
  - _Requirements: 35_

- [ ] P3.31.3 Add keyboard navigation
  - Tab order for all interactive elements
  - Focus indicators
  - Keyboard shortcuts documentation
  - _Requirements: 35_

### P3.32 Performance Optimization

- [ ] P3.32.1 Implement code splitting
  - Split routes with React.lazy
  - Split heavy components
  - Measure bundle sizes
  - _Requirements: 33_

- [ ] P3.32.2 Add virtualization for large lists
  - Install @tanstack/react-virtual
  - Virtualize WorkoutList for >50 steps
  - Test performance
  - _Requirements: 33_

- [ ] P3.32.3 Optimize re-renders
  - Add React.memo where needed
  - Use useMemo for expensive calculations
  - Use useCallback for stable callbacks
  - _Requirements: 33_

### P3.33 Analytics and Monitoring

- [ ] P3.33.1 Implement analytics service
  - Create AnalyticsProvider interface
  - Add Plausible provider (privacy-friendly)
  - Track key events
  - _Requirements: N/A (design feature)_

- [ ] P3.33.2 Add Web Vitals tracking
  - Track CLS, FID, FCP, LCP, TTFB
  - Report to analytics
  - Monitor performance
  - _Requirements: 33_

- [ ] P3.33.3 Set up error tracking
  - Configure Sentry (optional)
  - Track errors with context
  - Filter sensitive data
  - _Requirements: 36_

### P3.34 Testing

- [ ]\* P3.34.1 Set up testing infrastructure
  - Configure Vitest
  - Set up React Testing Library
  - Configure test coverage
  - _Requirements: N/A (quality assurance)_

- [ ]\* P3.34.2 Write unit tests for core logic
  - Test state management
  - Test validation functions
  - Test calculation utilities
  - _Requirements: N/A (quality assurance)_

- [ ]\* P3.34.3 Write component tests
  - Test key components
  - Test user interactions
  - Test accessibility
  - _Requirements: N/A (quality assurance)_

- [ ]\* P3.34.4 Set up E2E tests with Playwright
  - Configure Playwright
  - Write critical path tests
  - Add to CI pipeline
  - _Requirements: N/A (quality assurance)_

## Notes

- Tasks marked with `*` are optional testing tasks
- Each task references the requirements it implements
- Prioritization allows for incremental delivery
- MVP (Phase 1-2) delivers core value quickly
- Enhanced features (Phase 3-4) add polish and advanced functionality
