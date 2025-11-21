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

## Usage Notes

### Step Reordering

- **Selection Required**: A step must be selected before using reordering shortcuts
- **Boundary Handling**:
  - `Alt+Up` has no effect if the step is already at the top
  - `Alt+Down` has no effect if the step is already at the bottom
- **Undo Support**: Step reordering can be undone with `Ctrl+Z` / `Cmd+Z`

### Platform Differences

- **Windows/Linux**: Use `Ctrl` key
- **macOS**: Use `Cmd` (⌘) key
- **All Platforms**: Use `Alt` key for step reordering

## Implementation

Keyboard shortcuts are implemented in:

- `src/hooks/useKeyboardShortcuts.ts` - Hook for registering shortcuts
- `src/App.tsx` - Integration with application state

## Testing

Keyboard shortcuts are tested in:

- `src/hooks/useKeyboardShortcuts.test.ts` - Unit tests for the hook
- `src/App.test.tsx` - Integration tests for reordering functionality
- `e2e/accessibility.spec.ts` - End-to-end tests for accessibility

## Accessibility

All keyboard shortcuts follow accessibility best practices:

- Standard modifier keys (Ctrl/Cmd, Alt)
- No conflicts with browser shortcuts
- Clear visual feedback when actions are performed
- Screen reader announcements for drag-and-drop operations
