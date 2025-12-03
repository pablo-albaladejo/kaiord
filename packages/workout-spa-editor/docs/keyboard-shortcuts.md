# Keyboard Shortcuts

The Workout SPA Editor supports keyboard shortcuts for efficient workflow.

## Available Shortcuts

### File Operations

| Shortcut           | Action | Description                            |
| ------------------ | ------ | -------------------------------------- |
| `Ctrl+S` / `Cmd+S` | Save   | Save the current workout to a KRD file |

### Editing Operations

| Shortcut                       | Action | Description                 |
| ------------------------------ | ------ | --------------------------- |
| `Ctrl+Z` / `Cmd+Z`             | Undo   | Undo the last change        |
| `Ctrl+Y` / `Cmd+Y`             | Redo   | Redo the last undone change |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo   | Alternative redo shortcut   |

### Step Reordering (Requirement 29)

| Shortcut   | Action         | Description                              |
| ---------- | -------------- | ---------------------------------------- |
| `Alt+Up`   | Move Step Up   | Move the selected step up one position   |
| `Alt+Down` | Move Step Down | Move the selected step down one position |

### Repetition Block Operations (Requirement 4.1)

| Shortcut    | Action                  | Description                                               |
| ----------- | ----------------------- | --------------------------------------------------------- |
| `Delete`    | Delete Repetition Block | Delete the selected repetition block and all its steps    |
| `Backspace` | Delete Repetition Block | Alternative shortcut to delete the selected block         |
| `Escape`    | Dismiss Modal           | Close any open confirmation modal without taking action   |
| `Enter`     | Confirm Action          | Confirm the action in an open modal (when button focused) |

## Usage Notes

### Step Reordering

- **Selection Required**: A step must be selected before using reordering shortcuts
- **Boundary Handling**:
  - `Alt+Up` has no effect if the step is already at the top
  - `Alt+Down` has no effect if the step is already at the bottom
- **Undo Support**: Step reordering can be undone with `Ctrl+Z` / `Cmd+Z`

### Repetition Block Deletion

- **Selection Required**: A repetition block must be focused/selected before using deletion shortcuts
- **Confirmation**: No confirmation modal is shown for keyboard deletion (same as UI button)
- **Undo Support**: Block deletion can be undone with `Ctrl+Z` / `Cmd+Z`
- **Focus Management**: After deletion, focus moves to:
  - Next block or step (if available)
  - Previous block or step (if at the end)
  - Add step button (if no other elements)
- **Complete Deletion**: Deleting a block removes the entire block and all its contained steps

### Platform Differences

- **Windows/Linux**: Use `Ctrl` key
- **macOS**: Use `Cmd` (⌘) key
- **All Platforms**: Use `Alt` key for step reordering

## Implementation

Keyboard shortcuts are implemented in:

- `src/hooks/useKeyboardShortcuts.ts` - Hook for registering shortcuts
- `src/App.tsx` - Integration with application state
- `src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.tsx` - Block deletion shortcuts
- `src/components/molecules/ConfirmationModal/ConfirmationModal.tsx` - Modal keyboard handling

## Testing

Keyboard shortcuts are tested in:

- `src/hooks/useKeyboardShortcuts.test.ts` - Unit tests for the hook
- `src/App.test.tsx` - Integration tests for reordering functionality
- `src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.accessibility.test.tsx` - Block deletion keyboard tests
- `e2e/accessibility.spec.ts` - End-to-end tests for accessibility
- `e2e/repetition-blocks.spec.ts` - E2E tests for block operations
- `e2e/modal-interactions.spec.ts` - E2E tests for modal keyboard interactions

## Accessibility

All keyboard shortcuts follow accessibility best practices:

- Standard modifier keys (Ctrl/Cmd, Alt)
- No conflicts with browser shortcuts
- Clear visual feedback when actions are performed
- Screen reader announcements for drag-and-drop operations
