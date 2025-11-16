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
- ⚠️ **E2E Tests:** 60/95 passing (63%) - 35 tests failing
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
- ✅ Comprehensive testing (380+ unit tests passing)
- ✅ Component documentation (Storybook)
- ✅ GitHub Pages deployment
- ✅ Theme system (light/dark/Kiroween)

### Known Issues to Fix (P1c)

- ⚠️ **35/95 E2E tests failing (63% passing)** - Timeout issues:
  - Workflow tests timing out (create, edit, save flows)
  - Smooth scrolling tests failing
  - Theme transition tests failing
  - Focus indicator tests timing out on webkit/mobile
  - Tablet layout tests timing out
  - Keyboard shortcut tests timing out (shortcuts ARE implemented)
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

1. **Fix 35 failing E2E tests** (P1c.1) - Timeout issues in workflows, scrolling, themes, focus
2. **Implement success notifications** (P1c.2) - Toast system for save, copy, delete actions
3. **Verify all E2E tests pass** (P1c.3) - Target 100% passing (95/95 tests)

**Estimated Effort:** 6-8 hours
**Priority:** HIGH - Blocking v1.0.0 release

## Priority Matrix

- **P0 (MVP)**: High impact + Low complexity - Core features for basic functionality ✅ **COMPLETE**
- **P1 (Core)**: High impact + Medium complexity - Essential features ✅ **COMPLETE**
- **P1b (QA)**: Quality assurance and polish ✅ **COMPLETE**
- **P1c (Fixes)**: Critical bug fixes ⚠️ **IN PROGRESS**
- **P2 (Enhanced)**: Medium impact + Low/Medium complexity - Nice-to-have features 📋 **PLANNED**
- **P3 (Advanced)**: Low impact or High complexity - Optional/future features 📋 **PLANNED**

## P1c: Critical Bug Fixes (v1.0.0 Release Blockers)

### P1c.1 Fix E2E Test Failures (35 failing tests)

**Summary:** 35/95 tests failing across all browsers (63% passing). Main issues:

1. ✅ Keyboard shortcuts implemented but tests timing out (30s)
2. ✅ Touch support enabled but some tests still failing
3. ❌ Workflow tests timing out (create, edit, save flows)
4. ❌ Smooth scrolling tests failing
5. ❌ Theme transition tests failing
6. ❌ Focus indicator tests timing out on webkit/mobile

**Status:** Most infrastructure is in place. Failures are primarily timeout issues in complex workflows, suggesting performance or selector problems rather than missing features.

- [ ] P1c.1.1 Fix workflow test timeouts (create, edit, save)
  - Tests timeout after 30s waiting for elements
  - Affects: workout-creation.spec.ts (create, duplicate, delete, undo/redo)
  - Affects: workout-load-edit-save.spec.ts (load, edit, save flow)
  - Debug: Check if elements are rendering, improve selectors
  - Consider: Add data-testid attributes for complex workflows
  - _Requirements: 2, 3, 6, 7, 15, 16_
  - _Files: e2e/workout-creation.spec.ts, e2e/workout-load-edit-save.spec.ts_

- [ ] P1c.1.2 Fix smooth scrolling tests
  - Tests timeout waiting for smooth scroll behavior
  - Affects: mobile-responsive.spec.ts (scroll smoothly on mobile)
  - Debug: Verify scroll-behavior CSS property is applied
  - Consider: Adjust test expectations or implementation
  - _Requirements: 8_
  - _Files: e2e/mobile-responsive.spec.ts, index.css_

- [ ] P1c.1.3 Fix theme transition tests
  - Tests fail checking for transition classes
  - Affects: accessibility.spec.ts (smooth theme transitions)
  - Debug: Verify transition CSS is applied during theme change
  - Consider: Add explicit transition classes or adjust test
  - _Requirements: 13_
  - _Files: e2e/accessibility.spec.ts, ThemeContext.tsx_

- [ ] P1c.1.4 Fix focus indicator tests on webkit/mobile
  - Tests timeout waiting for focus indicators
  - Affects: accessibility.spec.ts (visible focus indicators) on webkit/Mobile Safari
  - Debug: Verify focus-visible styles work on webkit
  - Consider: Webkit-specific focus styles or polyfill
  - _Requirements: 35_
  - _Files: e2e/accessibility.spec.ts, index.css_

- [ ] P1c.1.5 Fix tablet layout tests
  - Tests timeout waiting for tablet-specific layout
  - Affects: mobile-responsive.spec.ts (adapt layout for tablet)
  - Debug: Verify breakpoints and responsive classes
  - Consider: Add explicit tablet breakpoint styles
  - _Requirements: 8_
  - _Files: e2e/mobile-responsive.spec.ts, tailwind.config.js_

- [ ] P1c.1.6 Fix keyboard shortcut tests
  - Tests timeout waiting for keyboard shortcut actions
  - Keyboard shortcuts ARE implemented (useKeyboardShortcuts hook)
  - Debug: Verify shortcuts work in test environment
  - Consider: Add explicit wait for action completion
  - _Requirements: 29_
  - _Files: e2e/accessibility.spec.ts, hooks/useKeyboardShortcuts.ts_

### P1c.2 Implement Success Notifications

**Status:** @radix-ui/react-toast is already installed. Need to create components and integrate.

- [ ] P1c.2.1 Create Toast component system
  - Create Toast component in components/atoms/Toast/
  - Create ToastProvider wrapper component
  - Create useToast hook for easy access
  - Add ToastProvider to App.tsx root
  - Test toast rendering and auto-dismiss
  - _Requirements: 39_
  - _Files: components/atoms/Toast/Toast.tsx, components/atoms/Toast/ToastProvider.tsx, hooks/useToast.ts_

- [ ] P1c.2.2 Implement save success notification
  - Remove TODO comment from SaveButton.tsx (line 39)
  - Show success toast when workout saves successfully
  - Include workout name in notification7y8
  - Test with E2E tests
  - _Requirements: 39.1_
  - # _Files: components/molecules/SaveButton/SaveButton.tsx_
