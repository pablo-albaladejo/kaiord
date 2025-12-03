# Modal System

This document describes the modal dialog system added in the 09-repetition-blocks-and-ui-polish specification.

## Overview

The Workout SPA Editor uses a custom modal dialog system built on Radix UI Dialog primitives. This replaces browser-native alerts (`window.alert`, `window.confirm`, `window.prompt`) with accessible, themeable, and user-friendly modal dialogs.

## Features

- ✅ **Focus Trap**: Keyboard navigation stays within the modal
- ✅ **Backdrop Dismissal**: Click outside to close
- ✅ **Escape Key**: Press `Escape` to dismiss
- ✅ **Focus Restoration**: Returns focus to triggering element after dismissal
- ✅ **Accessible**: Full WCAG 2.1 AA compliance
- ✅ **Responsive**: Adapts to mobile screens
- ✅ **Themeable**: Supports light, dark, and custom themes
- ✅ **Variants**: Default and destructive styles

## Component API

### ConfirmationModal

The main modal component for user confirmations.

```typescript
import { ConfirmationModal } from "@/components/molecules/ConfirmationModal";

<ConfirmationModal
  isOpen={true}
  title="Delete Workout?"
  message="This action cannot be undone. Are you sure you want to delete this workout?"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={() => console.log("Confirmed")}
  onCancel={() => console.log("Cancelled")}
  variant="destructive"
/>
```

### Props

| Prop           | Type                         | Required | Description                                    |
| -------------- | ---------------------------- | -------- | ---------------------------------------------- |
| `isOpen`       | `boolean`                    | Yes      | Controls modal visibility                      |
| `title`        | `string`                     | Yes      | Modal title (displayed in header)              |
| `message`      | `string`                     | Yes      | Modal message (displayed in body)              |
| `confirmLabel` | `string`                     | Yes      | Text for confirm button (e.g., "Delete")       |
| `cancelLabel`  | `string`                     | Yes      | Text for cancel button (e.g., "Cancel")        |
| `onConfirm`    | `() => void`                 | Yes      | Callback when user confirms                    |
| `onCancel`     | `() => void`                 | Yes      | Callback when user cancels or dismisses        |
| `variant`      | `"default" \| "destructive"` | Yes      | Visual style (default: blue, destructive: red) |

## Store Integration

### State

The modal state is managed in the Zustand store:

```typescript
type WorkoutState = {
  // ... other state
  modalConfig: ModalConfig | null;
  isModalOpen: boolean;
};

type ModalConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant: "default" | "destructive";
};
```

### Actions

**`showConfirmationModal(config: ModalConfig)`**

Opens a modal with the specified configuration.

```typescript
useWorkoutStore.getState().showConfirmationModal({
  title: "Delete Step?",
  message: "Are you sure you want to delete this step?",
  confirmLabel: "Delete",
  cancelLabel: "Cancel",
  onConfirm: () => {
    // Delete the step
    deleteStep(stepId);
  },
  variant: "destructive",
});
```

**`hideConfirmationModal()`**

Closes the currently open modal.

```typescript
useWorkoutStore.getState().hideConfirmationModal();
```

## Usage Examples

### Example 1: Destructive Action Confirmation

```typescript
const handleDeleteWorkout = () => {
  showConfirmationModal({
    title: "Delete Workout?",
    message:
      "This will permanently delete the workout. This action cannot be undone.",
    confirmLabel: "Delete Workout",
    cancelLabel: "Cancel",
    onConfirm: () => {
      deleteWorkout();
      hideConfirmationModal();
    },
    onCancel: () => {
      hideConfirmationModal();
    },
    variant: "destructive",
  });
};
```

### Example 2: Non-Destructive Confirmation

```typescript
const handleSaveWorkout = () => {
  if (hasUnsavedChanges) {
    showConfirmationModal({
      title: "Save Changes?",
      message:
        "You have unsaved changes. Would you like to save before continuing?",
      confirmLabel: "Save",
      cancelLabel: "Don't Save",
      onConfirm: () => {
        saveWorkout();
        hideConfirmationModal();
      },
      onCancel: () => {
        hideConfirmationModal();
      },
      variant: "default",
    });
  }
};
```

### Example 3: Discard Changes Warning

```typescript
const handleNavigateAway = () => {
  if (hasUnsavedChanges) {
    showConfirmationModal({
      title: "Discard Changes?",
      message:
        "You have unsaved changes. If you leave now, your changes will be lost.",
      confirmLabel: "Discard",
      cancelLabel: "Keep Editing",
      onConfirm: () => {
        navigate("/");
        hideConfirmationModal();
      },
      variant: "destructive",
    });
  } else {
    navigate("/");
  }
};
```

## Keyboard Interactions

| Key         | Action                                                |
| ----------- | ----------------------------------------------------- |
| `Escape`    | Dismiss modal (calls `onCancel`)                      |
| `Tab`       | Move focus to next focusable element within modal     |
| `Shift+Tab` | Move focus to previous focusable element within modal |
| `Enter`     | Confirm action (when confirm button is focused)       |
| `Space`     | Activate focused button                               |

## Focus Management

### Focus Trap

When a modal is open:

1. Focus is trapped within the modal
2. Pressing `Tab` cycles through focusable elements in the modal
3. Background content cannot receive focus
4. Screen readers announce the modal content

### Focus Restoration

When a modal is closed:

1. Focus returns to the element that triggered the modal
2. If the triggering element no longer exists, focus moves to the next logical element
3. Screen readers announce the focus change

## Accessibility

### WCAG 2.1 AA Compliance

- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Focus Management**: Proper focus trap and restoration
- ✅ **Screen Reader**: ARIA labels and roles
- ✅ **Color Contrast**: 4.5:1 minimum contrast ratio
- ✅ **Touch Targets**: Minimum 44x44px button size

### ARIA Attributes

```html
<div
  role="dialog"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal message</p>
  <button aria-label="Close">×</button>
  <button>Cancel</button>
  <button>Confirm</button>
</div>
```

### Screen Reader Announcements

- **Modal opens**: "Dialog: [Title]. [Message]"
- **Focus trap**: "Focus is trapped in dialog. Press Escape to close."
- **Modal closes**: "Dialog closed. Focus returned to [element]."

## Styling

### Variants

**Default Variant**:

- Confirm button: Primary blue color
- Use for: Non-destructive actions, saves, confirmations

**Destructive Variant**:

- Confirm button: Danger red color
- Use for: Deletions, permanent actions, data loss warnings

### Theme Support

The modal supports all application themes:

- **Light Mode**: White background, dark text
- **Dark Mode**: Dark gray background, light text
- **Kiroween Theme**: Custom Halloween theme colors

### Responsive Design

**Desktop (≥640px)**:

- Modal width: 512px (max-w-lg)
- Centered on screen
- Backdrop blur effect

**Mobile (<640px)**:

- Modal width: 100% with padding
- Full-width buttons
- Optimized touch targets

## Animation

### Open Animation

1. Backdrop fades in (200ms)
2. Modal scales up from 95% to 100% (200ms)
3. Modal slides in from center (200ms)

### Close Animation

1. Modal scales down to 95% (150ms)
2. Modal fades out (150ms)
3. Backdrop fades out (150ms)

## Testing

### Unit Tests

- `src/components/molecules/ConfirmationModal/ConfirmationModal.test.tsx` - Component tests
- `src/components/molecules/ConfirmationModal/ConfirmationModal.accessibility.test.tsx` - Accessibility tests
- `src/store/workout-store-modal-actions.test.ts` - Store action tests

### E2E Tests

- `e2e/modal-interactions.spec.ts` - Modal interaction flows
- `e2e/accessibility.spec.ts` - Keyboard navigation and focus management

### Property-Based Tests

- Property 13: No browser alerts for confirmations
- Property 14: Modal focus trap
- Property 15: Modal dismissal with Escape
- Property 16: Modal blocks background interaction
- Property 17: Focus restoration after modal

## Migration from Browser Alerts

### Before (Browser Alert)

```typescript
// ❌ Old: Browser alert
const confirmed = window.confirm("Delete this step?");
if (confirmed) {
  deleteStep(stepId);
}
```

### After (Modal Dialog)

```typescript
// ✅ New: Modal dialog
showConfirmationModal({
  title: "Delete Step?",
  message: "Are you sure you want to delete this step?",
  confirmLabel: "Delete",
  cancelLabel: "Cancel",
  onConfirm: () => {
    deleteStep(stepId);
    hideConfirmationModal();
  },
  variant: "destructive",
});
```

## Best Practices

### Do's ✅

- Use descriptive titles that clearly state the action
- Write clear, concise messages explaining the consequences
- Use action-specific confirm labels ("Delete", "Save", "Continue")
- Use destructive variant for permanent or data-loss actions
- Always provide a cancel option
- Handle both `onConfirm` and `onCancel` callbacks

### Don'ts ❌

- Don't use generic titles like "Confirm" or "Warning"
- Don't write long, technical messages
- Don't use generic confirm labels like "OK" or "Yes"
- Don't use destructive variant for non-destructive actions
- Don't forget to call `hideConfirmationModal()` in callbacks
- Don't nest modals (one modal at a time)

## Performance

### Optimization Strategies

1. **Conditional Rendering**: Modal only renders when `isOpen` is true
2. **Portal Rendering**: Modal renders in a portal to avoid z-index issues
3. **React.memo**: Modal component is memoized to prevent unnecessary re-renders
4. **Lazy Loading**: Modal content loads only when needed

### Performance Budget

- Modal open: < 200ms (including animation)
- Modal close: < 150ms (including animation)
- Focus trap: < 50ms (imperceptible to users)

## Related Documentation

- [Keyboard Shortcuts](./keyboard-shortcuts.md) - Keyboard navigation guide
- [Repetition Block Deletion](./repetition-block-deletion.md) - Block deletion feature
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog) - Underlying primitive

## Requirements

This feature implements the following requirements from the specification:

- **Requirement 6**: Replace Browser Alerts with Modal Dialogs

See `.kiro/specs/workout-spa-editor/09-repetition-blocks-and-ui-polish/requirements.md` for complete requirements.
