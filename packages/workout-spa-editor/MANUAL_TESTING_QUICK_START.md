# Manual Testing Quick Start Guide

**For**: QA Engineers, Developers, Stakeholders  
**Purpose**: Quick reference for performing manual testing of the Workout SPA Editor

---

## 🚀 Getting Started (5 minutes)

### 1. Set Up Your Environment

```bash
# Navigate to the workout-spa-editor package
cd packages/workout-spa-editor

# Install dependencies (if not already done)
pnpm install

# Start the development server
pnpm dev

# Open in browser
# http://localhost:5173
```

### 2. Prepare Test Files

You'll need sample KRD workout files for testing. Use these options:

**Option A: Use existing test fixtures**

```bash
# Test fixtures are in the core package
ls ../../packages/core/src/tests/fixtures/krd-files/
```

**Option B: Create a simple test workout**
Create a file named `test-workout.krd` with this content:

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": {
    "created": "2025-01-16T10:00:00Z",
    "sport": "running"
  },
  "extensions": {
    "workout": {
      "name": "Test Workout",
      "sport": "running",
      "steps": [
        {
          "stepIndex": 0,
          "durationType": "time",
          "duration": { "type": "time", "seconds": 300 },
          "targetType": "heart_rate",
          "target": {
            "type": "heart_rate",
            "value": { "unit": "zone", "value": 2 }
          },
          "intensity": "warmup"
        },
        {
          "stepIndex": 1,
          "durationType": "time",
          "duration": { "type": "time", "seconds": 600 },
          "targetType": "heart_rate",
          "target": {
            "type": "heart_rate",
            "value": { "unit": "zone", "value": 4 }
          },
          "intensity": "active"
        },
        {
          "stepIndex": 2,
          "durationType": "time",
          "duration": { "type": "time", "seconds": 300 },
          "targetType": "open",
          "target": { "type": "open" },
          "intensity": "cooldown"
        }
      ]
    }
  }
}
```

### 3. Open the Testing Checklist

Open `MANUAL_TESTING_CHECKLIST.md` in your editor or print it out.

---

## ⚡ Critical Path Testing (15 minutes)

**Test these flows first** - they cover the most important functionality:

### Flow 1: Load → Edit → Save (5 min)

1. ✅ Click "Load Workout" button
2. ✅ Select your test KRD file
3. ✅ Verify workout displays with 3 steps
4. ✅ Click on step 2 (the active interval)
5. ✅ Click "Edit" button
6. ✅ Change duration from 600s to 900s
7. ✅ Click "Save"
8. ✅ Verify step updates in the list
9. ✅ Click "Save Workout" button
10. ✅ Verify file downloads

**Expected**: All steps work smoothly, no errors

### Flow 2: Create → Add Steps → Save (5 min)

1. ✅ Refresh the page (start fresh)
2. ✅ Click "Add Step" button
3. ✅ Set duration to "time" with 300 seconds
4. ✅ Set target to "power" with zone 2
5. ✅ Save the step
6. ✅ Add 2 more steps with different values
7. ✅ Verify all 3 steps appear in the list
8. ✅ Save the workout
9. ✅ Verify file downloads

**Expected**: New workout creates successfully

### Flow 3: Delete → Undo (5 min)

1. ✅ Load a workout with 3+ steps
2. ✅ Click delete icon on step 2
3. ✅ Verify confirmation dialog appears
4. ✅ Click "Confirm"
5. ✅ Verify step is deleted
6. ✅ Press Ctrl+Z (Cmd+Z on Mac)
7. ✅ Verify step is restored
8. ✅ Press Ctrl+Y (Cmd+Shift+Z on Mac)
9. ✅ Verify step is deleted again

**Expected**: Undo/redo works correctly

---

## 📱 Mobile Testing (10 minutes)

### Quick Mobile Check

1. ✅ Open Chrome DevTools (F12)
2. ✅ Click device toolbar icon (Ctrl+Shift+M)
3. ✅ Select "iPhone 12 Pro"
4. ✅ Reload the page
5. ✅ Verify mobile layout appears
6. ✅ Load a workout
7. ✅ Tap on a step (verify touch works)
8. ✅ Edit a step (verify mobile keyboard)
9. ✅ Scroll through steps (verify smooth scrolling)
10. ✅ Try "Add Step" button (verify touch target size)

**Expected**: Mobile layout works, touch targets are large enough

### Real Device Testing (if available)

1. ✅ Get the local network URL (shown in terminal when running `pnpm dev`)
2. ✅ Open on your phone's browser
3. ✅ Test the same flows as desktop
4. ✅ Verify touch gestures work
5. ✅ Verify mobile keyboard appears correctly

---

## 🎨 Responsive Design Check (5 minutes)

### Test All Breakpoints

1. ✅ Open Chrome DevTools
2. ✅ Enable responsive mode
3. ✅ Test these widths:
   - 375px (mobile)
   - 768px (tablet)
   - 1024px (desktop)
   - 1920px (large desktop)
4. ✅ Verify no horizontal scrolling at any size
5. ✅ Verify content is readable at all sizes
6. ✅ Verify buttons are appropriately sized

**Expected**: Layout adapts smoothly, no breaks

---

## ⚠️ Error Handling Check (5 minutes)

### Test Invalid Files

1. ✅ Try to load a .txt file
   - **Expected**: Error message appears
2. ✅ Try to load an empty file
   - **Expected**: Error message appears
3. ✅ Try to load invalid JSON
   - **Expected**: Parsing error appears
4. ✅ Try to load valid JSON but invalid KRD
   - **Expected**: Validation errors appear with field names

**Expected**: All errors show helpful messages

---

## 📊 Performance Check (5 minutes)

### Test with Large Workout

1. ✅ Create or load a workout with 50+ steps
2. ✅ Scroll through the list
   - **Expected**: Smooth scrolling, no lag
3. ✅ Edit a step in the middle
   - **Expected**: Opens quickly
4. ✅ Save the workout
   - **Expected**: Saves without freezing
5. ✅ Check browser memory (DevTools → Memory)
   - **Expected**: No memory leaks

---

## ✅ Quick Checklist Summary

Use this for a fast smoke test (10 minutes total):

- [ ] Load workout works
- [ ] Edit step works
- [ ] Save workout works
- [ ] Add step works
- [ ] Delete step works (with confirmation)
- [ ] Duplicate step works
- [ ] Undo/redo works (Ctrl+Z, Ctrl+Y)
- [ ] Mobile layout works (DevTools)
- [ ] Error messages appear for invalid files
- [ ] Performance is acceptable with 50+ steps

---

## 🐛 Found an Issue?

### How to Report

1. **Take a screenshot** - Visual evidence helps
2. **Note the steps to reproduce** - Be specific
3. **Include device/browser info** - OS, browser, version
4. **Describe expected vs actual** - What should happen vs what did happen
5. **Assign severity**:
   - **Critical**: App unusable, blocks core functionality
   - **High**: Major feature broken, workaround exists
   - **Medium**: Minor issue, doesn't block workflow
   - **Low**: Cosmetic issue

### Where to Report

- Create a GitHub issue with the template above
- Or add to the Issues table in `MANUAL_TESTING_CHECKLIST.md`

---

## 📚 Full Testing Documentation

For comprehensive testing, see:

- **MANUAL_TESTING_CHECKLIST.md** - Complete testing checklist (500+ lines)
- **P1B10_MANUAL_TESTING_COMPLETE.md** - Task completion summary
- **TESTING.md** - Automated testing documentation
- **E2E_TEST_STATUS.md** - E2E test coverage

---

## 🎯 Testing Goals

### Minimum Acceptable

- ✅ All critical path flows work
- ✅ Mobile layout is usable
- ✅ Error messages are clear
- ✅ No crashes or freezes

### Ideal

- ✅ All flows work on all devices
- ✅ Performance is excellent
- ✅ Accessibility is perfect
- ✅ Edge cases handled gracefully

---

## 💡 Testing Tips

1. **Test in private/incognito mode** - Avoids extension interference
2. **Clear cache between tests** - Ensures fresh state
3. **Use real devices when possible** - Emulators miss some issues
4. **Test with slow network** - Use DevTools throttling
5. **Test keyboard navigation** - Tab through everything
6. **Test with different data** - Empty, small, large workouts

---

## 🚦 Sign-Off Criteria

Before marking testing as complete:

- [ ] All critical path flows tested and passing
- [ ] Mobile testing completed (at least DevTools)
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] No critical or high severity bugs
- [ ] Documentation updated with any issues found

---

## Need Help?

- Check the full checklist: `MANUAL_TESTING_CHECKLIST.md`
- Review requirements: `.kiro/specs/workout-spa-editor/requirements.md`
- Check design: `.kiro/specs/workout-spa-editor/design.md`
- Ask the team: Create a GitHub discussion

---

**Happy Testing! 🎉**
