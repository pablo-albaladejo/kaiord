# Manual Testing Checklist - P1b.10

**Task**: User Experience Polish and Manual Testing  
**Requirements**: 1, 2, 3, 5, 6, 7, 8, 9, 36

This document provides a comprehensive checklist for manual testing of the Workout SPA Editor across different devices, screen sizes, and scenarios.

---

## Testing Environment Setup

### Desktop Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, macOS only)
- [ ] Edge (latest)

### Mobile Testing

- [ ] iOS Safari (iPhone 12 or newer)
- [ ] Android Chrome (Pixel 5 or newer)

### Tablet Testing

- [ ] iPad Safari (iPad Air or newer)
- [ ] Android Chrome (Samsung Galaxy Tab or similar)

### Screen Sizes to Test

- [ ] Mobile: 375px - 767px
- [ ] Tablet: 768px - 1023px
- [ ] Desktop: 1024px and above

---

## 1. End-to-End User Flows (Desktop)

### Flow 1: Load and Edit Workout

**Requirement 1, 3, 7**

- [ ] Open application in browser
- [ ] Click "Load Workout" button
- [ ] Select a valid KRD file from test fixtures
- [ ] Verify workout loads and displays correctly
- [ ] Verify workout name appears in header
- [ ] Verify all steps are visible in WorkoutList
- [ ] Click on a step to select it
- [ ] Verify step highlights/selects
- [ ] Click "Edit" button or double-click step
- [ ] Verify StepEditor opens with current values
- [ ] Modify duration (change time from 300s to 600s)
- [ ] Verify real-time validation (no errors for valid input)
- [ ] Modify target (change from zone 2 to zone 3)
- [ ] Click "Save" button
- [ ] Verify step updates in WorkoutList
- [ ] Verify success feedback appears
- [ ] Verify WorkoutStats updates with new values

**Expected Results**:

- ✅ All UI elements render correctly
- ✅ Loading states appear during file parsing
- ✅ Step selection provides visual feedback
- ✅ Editor opens smoothly with correct values
- ✅ Changes save successfully
- ✅ Success message appears
- ✅ Statistics update in real-time

### Flow 2: Create New Workout

**Requirement 2**

- [ ] Open application
- [ ] Click "New Workout" or start with empty state
- [ ] Click "Add Step" button
- [ ] Verify new step appears with default values
- [ ] Edit step: set duration to "time" with 300 seconds
- [ ] Edit step: set target to "power" with zone 2
- [ ] Save step
- [ ] Verify step appears in WorkoutList
- [ ] Add 3 more steps with different configurations
- [ ] Verify all steps display correctly
- [ ] Verify WorkoutStats shows cumulative values

**Expected Results**:

- ✅ New steps create successfully
- ✅ Default values are sensible
- ✅ Multiple steps can be added
- ✅ Statistics calculate correctly

### Flow 3: Step Management (Delete, Duplicate)

**Requirement 5, 16**

- [ ] Load or create a workout with 5+ steps
- [ ] Click duplicate icon on step 2
- [ ] Verify confirmation or immediate duplication
- [ ] Verify duplicated step appears after original
- [ ] Verify step indices recalculate correctly
- [ ] Click delete icon on step 3
- [ ] Verify delete confirmation dialog appears
- [ ] Click "Cancel" in dialog
- [ ] Verify step is NOT deleted
- [ ] Click delete icon again
- [ ] Click "Confirm" in dialog
- [ ] Verify step is deleted
- [ ] Verify remaining steps renumber correctly
- [ ] Verify WorkoutStats updates

**Expected Results**:

- ✅ Duplicate creates exact copy
- ✅ Delete shows confirmation
- ✅ Cancel prevents deletion
- ✅ Confirm completes deletion
- ✅ Step indices update correctly
- ✅ Statistics recalculate

### Flow 4: Undo/Redo Operations

**Requirement 15**

- [ ] Load a workout
- [ ] Make a change (edit a step)
- [ ] Press Ctrl+Z (Cmd+Z on Mac)
- [ ] Verify change is undone
- [ ] Press Ctrl+Y (Cmd+Shift+Z on Mac)
- [ ] Verify change is redone
- [ ] Make multiple changes (edit, delete, duplicate)
- [ ] Undo all changes one by one
- [ ] Verify each undo restores previous state
- [ ] Redo all changes
- [ ] Verify each redo reapplies changes

**Expected Results**:

- ✅ Undo reverses changes
- ✅ Redo reapplies changes
- ✅ Multiple undo/redo works correctly
- ✅ State remains consistent

### Flow 5: Save Workout

**Requirement 6**

- [ ] Create or edit a workout
- [ ] Click "Save" button or press Ctrl+S (Cmd+S on Mac)
- [ ] Verify file download triggers
- [ ] Verify filename is correct (workout-name.krd)
- [ ] Open downloaded file in text editor
- [ ] Verify JSON is valid
- [ ] Verify all workout data is present
- [ ] Load the saved file back into the app
- [ ] Verify workout loads correctly

**Expected Results**:

- ✅ Save triggers download
- ✅ File is valid KRD format
- ✅ Round-trip works (save → load)
- ✅ Success message appears

### Flow 6: Error Handling

**Requirement 36**

- [ ] Try to load an invalid JSON file
- [ ] Verify error message appears
- [ ] Verify error message is helpful and actionable
- [ ] Verify error message includes specific issue
- [ ] Try to load a valid JSON but invalid KRD schema
- [ ] Verify validation errors appear
- [ ] Verify errors reference specific fields
- [ ] Try to save with invalid data (if possible)
- [ ] Verify validation prevents save
- [ ] Verify error messages guide user to fix issues

**Expected Results**:

- ✅ Invalid files show clear errors
- ✅ Validation errors are specific
- ✅ Error messages are actionable
- ✅ User can recover from errors

---

## 2. Mobile Device Testing (iOS Safari)

### Mobile Flow 1: Load and Edit on iPhone

**Requirement 8**

- [ ] Open app on iPhone (iOS Safari)
- [ ] Verify mobile-optimized layout renders
- [ ] Verify touch targets are at least 44x44 pixels
- [ ] Load a workout file
- [ ] Verify file picker works on mobile
- [ ] Tap on a step to select
- [ ] Verify tap registers correctly
- [ ] Tap "Edit" button
- [ ] Verify editor opens in mobile view
- [ ] Edit duration using mobile keyboard
- [ ] Verify number input keyboard appears
- [ ] Save changes
- [ ] Verify changes apply correctly

**Expected Results**:

- ✅ Layout is mobile-optimized
- ✅ Touch targets are large enough
- ✅ Interactions work smoothly
- ✅ Mobile keyboard is appropriate
- ✅ No horizontal scrolling required

### Mobile Flow 2: Scroll and Navigation

**Requirement 8**

- [ ] Load workout with 10+ steps
- [ ] Scroll through workout list
- [ ] Verify smooth scrolling with momentum
- [ ] Verify no janky animations
- [ ] Swipe gestures work (if implemented)
- [ ] Pinch to zoom is disabled (if appropriate)
- [ ] Verify all content is accessible via scrolling

**Expected Results**:

- ✅ Scrolling is smooth
- ✅ Momentum scrolling works
- ✅ No performance issues
- ✅ All content accessible

### Mobile Flow 3: Step Management on Mobile

**Requirement 8**

- [ ] Add a new step on mobile
- [ ] Verify "Add Step" button is easily tappable
- [ ] Duplicate a step
- [ ] Verify duplicate icon is tappable
- [ ] Delete a step
- [ ] Verify delete confirmation is mobile-friendly
- [ ] Verify dialog buttons are large enough

**Expected Results**:

- ✅ All actions work on mobile
- ✅ Buttons are appropriately sized
- ✅ Dialogs are mobile-optimized

---

## 3. Mobile Device Testing (Android Chrome)

### Android Flow 1: Basic Functionality

**Requirement 8**

- [ ] Open app on Android device (Chrome)
- [ ] Verify layout renders correctly
- [ ] Load a workout
- [ ] Edit a step
- [ ] Save workout
- [ ] Verify all core features work

**Expected Results**:

- ✅ Android Chrome renders correctly
- ✅ No Android-specific issues
- ✅ Performance is acceptable

### Android Flow 2: Keyboard and Input

**Requirement 8**

- [ ] Open step editor
- [ ] Test number inputs
- [ ] Verify Android keyboard appears
- [ ] Test select dropdowns
- [ ] Verify native Android pickers work
- [ ] Test text inputs (workout name, notes)

**Expected Results**:

- ✅ Android inputs work correctly
- ✅ Keyboard types are appropriate
- ✅ Native controls function properly

---

## 4. Tablet Testing (iPad)

### Tablet Flow 1: Responsive Layout

**Requirement 8**

- [ ] Open app on iPad (Safari)
- [ ] Verify layout uses tablet-optimized design
- [ ] Verify content doesn't look stretched
- [ ] Verify spacing is appropriate for tablet
- [ ] Load and edit workout
- [ ] Verify all features work on tablet

**Expected Results**:

- ✅ Tablet layout is optimized
- ✅ Not just scaled-up mobile view
- ✅ Uses available space effectively
- ✅ All features accessible

### Tablet Flow 2: Orientation Changes

**Requirement 8**

- [ ] Test in portrait orientation
- [ ] Rotate to landscape
- [ ] Verify layout adapts correctly
- [ ] Verify no content is cut off
- [ ] Verify no layout breaks occur

**Expected Results**:

- ✅ Both orientations work
- ✅ Layout adapts smoothly
- ✅ No visual glitches

---

## 5. Loading States Verification

### Loading State Checklist

**Requirement 36**

- [ ] File loading shows spinner/progress
- [ ] File parsing shows "Parsing..." message
- [ ] Save operation shows "Saving..." state
- [ ] Button shows loading state during async operations
- [ ] Loading states are visually clear
- [ ] Loading states don't block entire UI unnecessarily

**Expected Results**:

- ✅ All async operations show loading states
- ✅ Loading indicators are clear
- ✅ User knows something is happening

---

## 6. Error Messages Verification

### Error Message Checklist

**Requirement 36**

- [ ] Invalid file format error is clear
- [ ] Validation errors reference specific fields
- [ ] Network errors (if applicable) are helpful
- [ ] Error messages suggest solutions
- [ ] Errors don't use technical jargon
- [ ] Errors are displayed prominently
- [ ] Errors can be dismissed

**Test Cases**:

1. Load invalid JSON → "Invalid file format. Please select a valid KRD file."
2. Load valid JSON, invalid schema → "Validation failed: [field] is required"
3. Save with invalid data → "Cannot save: [specific issue]"

**Expected Results**:

- ✅ All errors are user-friendly
- ✅ Errors are actionable
- ✅ Technical details hidden or optional

---

## 7. Success Feedback Verification

### Success Feedback Checklist

**Requirement 39**

- [ ] Save success shows confirmation message
- [ ] Step creation shows success feedback
- [ ] Step deletion shows confirmation
- [ ] Step duplication shows feedback
- [ ] Edit save shows success message
- [ ] Success messages auto-dismiss after 3-5 seconds
- [ ] Success messages are visually distinct from errors

**Expected Results**:

- ✅ All actions provide feedback
- ✅ Success messages are clear
- ✅ Messages don't obstruct workflow

---

## 8. Responsive Design Validation

### Screen Size Testing

**Requirement 8**

#### Mobile (375px - 767px)

- [ ] Layout is single-column
- [ ] No horizontal scrolling
- [ ] Touch targets are 44x44px minimum
- [ ] Text is readable (16px minimum)
- [ ] Buttons are full-width or appropriately sized
- [ ] Forms are mobile-optimized

#### Tablet (768px - 1023px)

- [ ] Layout uses available space
- [ ] Two-column layout where appropriate
- [ ] Touch targets remain large
- [ ] Content is not stretched

#### Desktop (1024px+)

- [ ] Multi-column layout where appropriate
- [ ] Content is centered or well-distributed
- [ ] Maximum content width prevents over-stretching
- [ ] Hover states work correctly

**Expected Results**:

- ✅ All breakpoints work correctly
- ✅ No layout breaks at any size
- ✅ Content is always readable

---

## 9. Workout Size Testing

### Small Workout (Empty)

**Requirement 1**

- [ ] Open app with no workout loaded
- [ ] Verify empty state is clear
- [ ] Verify "Load Workout" or "Create Workout" CTA is prominent
- [ ] Verify no errors appear

**Expected Results**:

- ✅ Empty state is user-friendly
- ✅ Clear next steps provided

### Small Workout (1 Step)

**Requirement 1, 9**

- [ ] Create workout with 1 step
- [ ] Verify step displays correctly
- [ ] Verify statistics show correct values
- [ ] Edit the step
- [ ] Delete the step
- [ ] Verify empty state returns

**Expected Results**:

- ✅ Single step works correctly
- ✅ Statistics are accurate
- ✅ Edge case handled properly

### Medium Workout (10 Steps)

**Requirement 1, 9**

- [ ] Load or create workout with 10 steps
- [ ] Verify all steps display
- [ ] Verify scrolling works smoothly
- [ ] Verify statistics are correct
- [ ] Edit multiple steps
- [ ] Verify performance is good

**Expected Results**:

- ✅ 10 steps display correctly
- ✅ No performance issues
- ✅ Statistics accurate

### Large Workout (100 Steps)

**Requirement 1, 9, 33**

- [ ] Load or create workout with 100 steps
- [ ] Verify app doesn't freeze or lag
- [ ] Verify scrolling remains smooth
- [ ] Verify statistics calculate correctly
- [ ] Edit a step in the middle
- [ ] Verify save works with large workout
- [ ] Check memory usage (browser dev tools)

**Expected Results**:

- ✅ Large workouts don't cause performance issues
- ✅ Virtualization works (if implemented)
- ✅ Memory usage is reasonable
- ✅ All features work at scale

---

## 10. Edge Cases and Error Scenarios

### Edge Case 1: Invalid Files

**Requirement 7, 36**

- [ ] Try to load a .txt file
- [ ] Try to load a corrupted JSON file
- [ ] Try to load an empty file
- [ ] Try to load a very large file (>10MB)

**Expected Results**:

- ✅ All invalid files show appropriate errors
- ✅ App doesn't crash
- ✅ User can recover and try again

### Edge Case 2: Corrupted Data

**Requirement 36**

- [ ] Load KRD with missing required fields
- [ ] Load KRD with invalid field types
- [ ] Load KRD with out-of-range values

**Expected Results**:

- ✅ Validation catches all issues
- ✅ Specific errors shown for each problem
- ✅ App remains stable

### Edge Case 3: Network Errors (if applicable)

**Requirement 36**

- [ ] Test with slow network (throttle in dev tools)
- [ ] Test with offline mode
- [ ] Verify appropriate error messages

**Expected Results**:

- ✅ Network issues handled gracefully
- ✅ User informed of connectivity problems

### Edge Case 4: Browser Compatibility

**Requirement 33**

- [ ] Test in older browser versions (if supported)
- [ ] Verify polyfills work
- [ ] Verify graceful degradation

**Expected Results**:

- ✅ App works in all supported browsers
- ✅ Unsupported browsers show message

---

## 11. Accessibility Quick Check

### Keyboard Navigation

**Requirement 35**

- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Verify tab order is logical
- [ ] Test keyboard shortcuts (Ctrl+Z, Ctrl+S, etc.)
- [ ] Verify all actions accessible via keyboard

**Expected Results**:

- ✅ Full keyboard navigation works
- ✅ Focus indicators clear
- ✅ Shortcuts work correctly

### Screen Reader (Quick Test)

**Requirement 35**

- [ ] Enable VoiceOver (Mac) or NVDA (Windows)
- [ ] Navigate through app
- [ ] Verify buttons are announced correctly
- [ ] Verify form fields have labels
- [ ] Verify error messages are announced

**Expected Results**:

- ✅ Screen reader can navigate app
- ✅ All content is accessible
- ✅ ARIA labels are present

---

## 12. Performance Verification

### Performance Checklist

**Requirement 33**

- [ ] Initial load time < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Smooth animations (60fps)
- [ ] No janky scrolling
- [ ] File operations complete quickly
- [ ] No memory leaks (check dev tools)

**Expected Results**:

- ✅ App loads quickly
- ✅ Interactions are responsive
- ✅ No performance degradation over time

---

## Testing Sign-Off

### Completion Checklist

- [ ] All desktop flows tested and passing
- [ ] All mobile flows tested and passing (iOS)
- [ ] All mobile flows tested and passing (Android)
- [ ] All tablet flows tested and passing
- [ ] All loading states verified
- [ ] All error messages verified
- [ ] All success feedback verified
- [ ] All responsive breakpoints verified
- [ ] All workout sizes tested
- [ ] All edge cases tested
- [ ] Accessibility quick check completed
- [ ] Performance verified

### Issues Found

Document any issues found during testing:

| Issue # | Description | Severity | Device/Browser | Status |
| ------- | ----------- | -------- | -------------- | ------ |
| 1       |             |          |                |        |
| 2       |             |          |                |        |
| 3       |             |          |                |        |

### Severity Levels

- **Critical**: Blocks core functionality, app unusable
- **High**: Major feature broken, workaround exists
- **Medium**: Minor feature issue, doesn't block workflow
- **Low**: Cosmetic issue, doesn't affect functionality

---

## Notes for Testers

1. **Test with real devices when possible** - Emulators don't always catch touch/gesture issues
2. **Test with different network speeds** - Use Chrome DevTools network throttling
3. **Clear browser cache between tests** - Ensures fresh state
4. **Take screenshots of issues** - Helps with bug reports
5. **Test in private/incognito mode** - Avoids extension interference
6. **Document unexpected behavior** - Even if not a bug, may be UX issue

---

## Test Completion

**Tested by**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***  
**Date**: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***  
**Overall Status**: ⬜ Pass ⬜ Pass with Issues ⬜ Fail  
**Notes**:

---

## Next Steps After Testing

1. Document all issues found in GitHub Issues
2. Prioritize issues by severity
3. Fix critical and high severity issues
4. Retest after fixes
5. Update this checklist with any new test cases discovered
6. Mark P1b.10 as complete in tasks.md
