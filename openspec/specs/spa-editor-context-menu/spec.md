> Synced: 2026-04-17 (focus management updated to match implementation)

# SPA Editor Context Menu

## Requirements

### Requirement: Context-aware keyboard shortcut interception

Keyboard shortcuts SHALL only call `preventDefault()` when the app handler performs a meaningful action. When the handler is a no-op (e.g., no step selected for copy, no content to paste), the event SHALL pass through to the browser for native handling.

#### Scenario: Cmd+C with step selected

- **WHEN** the user presses Cmd+C (or Ctrl+C) and a workout step is selected
- **THEN** the system SHALL call `preventDefault()`, copy the step to the clipboard, and show a toast confirmation

#### Scenario: Cmd+C with no step selected

- **WHEN** the user presses Cmd+C (or Ctrl+C) and no workout step is selected
- **THEN** the system SHALL NOT call `preventDefault()`, allowing the browser to perform native text copy

#### Scenario: Cmd+X with a single step selected

- **WHEN** the user presses Cmd+X (or Ctrl+X) and a single workout step is selected
- **THEN** the system SHALL call `preventDefault()`, copy the step to the clipboard, delete it from the workout, and show a toast confirmation. Cut follows the same selection constraints as Delete (existing behavior)

#### Scenario: Cmd+X with multiple steps selected

- **WHEN** the user presses Cmd+X (or Ctrl+X) and multiple steps are selected
- **THEN** the system SHALL NOT call `preventDefault()`, allowing the browser to handle the event (multi-step cut is not supported; only single-step cut is supported, consistent with single-step copy)

#### Scenario: Cmd+X with no step selected

- **WHEN** the user presses Cmd+X (or Ctrl+X) and no workout step is selected
- **THEN** the system SHALL NOT call `preventDefault()`, allowing the browser to perform native text cut

#### Scenario: Cmd+V with clipboard content

- **WHEN** the user presses Cmd+V (or Ctrl+V) and the clipboard store contains step data
- **THEN** the system SHALL call `preventDefault()` and paste the step after the currently selected step, or at the end of the step list if no step is selected

#### Scenario: Cmd+V with clipboard content but no workout loaded

- **WHEN** the user presses Cmd+V (or Ctrl+V) and the clipboard store contains step data but no workout is loaded
- **THEN** the system SHALL NOT call `preventDefault()`, allowing the browser to perform native paste

#### Scenario: Cmd+V with empty clipboard store

- **WHEN** the user presses Cmd+V (or Ctrl+V) and the clipboard store has no step data
- **THEN** the system SHALL NOT call `preventDefault()`, allowing the browser to perform native paste

#### Scenario: Cmd+A with workout steps present

- **WHEN** the user presses Cmd+A (or Ctrl+A) and the workout has steps
- **THEN** the system SHALL call `preventDefault()` and select all steps

#### Scenario: Cmd+A with no workout or no selectable items

- **WHEN** the user presses Cmd+A (or Ctrl+A) and there is no workout or it has no selectable items (the step list has no individual steps with a `stepIndex` property)
- **THEN** the system SHALL NOT call `preventDefault()`, allowing native text selection

#### Scenario: Cmd+G with 2+ steps selected

- **WHEN** the user presses Cmd+G (or Ctrl+G) and 2 or more steps are selected
- **THEN** the system SHALL call `preventDefault()` and open the create repetition block dialog (existing behavior per Requirement 7.6.1)

#### Scenario: Cmd+G with fewer than 2 steps selected

- **WHEN** the user presses Cmd+G (or Ctrl+G) and fewer than 2 steps are selected
- **THEN** the system SHALL NOT call `preventDefault()`, allowing the browser to handle the event

#### Scenario: Cmd+S always intercepts

- **WHEN** the user presses Cmd+S (or Ctrl+S) regardless of editor state
- **THEN** the system SHALL always call `preventDefault()` to prevent the browser's "Save Page" dialog. If a workout is loaded, it SHALL trigger save; if no workout is loaded, it SHALL be a silent no-op (preventDefault still fires)

#### Scenario: Cmd+Z with undo history

- **WHEN** the user presses Cmd+Z (or Ctrl+Z) and the undo stack is not empty
- **THEN** the system SHALL call `preventDefault()` and perform undo

#### Scenario: Cmd+Z with no undo history

- **WHEN** the user presses Cmd+Z (or Ctrl+Z) and the undo stack is empty
- **THEN** the system SHALL still call `preventDefault()` to prevent the browser from undoing text input outside the editor

#### Scenario: Cmd+Y or Cmd+Shift+Z with redo history

- **WHEN** the user presses Cmd+Y (or Ctrl+Y) or Cmd+Shift+Z (or Ctrl+Shift+Z) and the redo stack is not empty
- **THEN** the system SHALL call `preventDefault()` and perform redo

#### Scenario: Cmd+Y or Cmd+Shift+Z with no redo history

- **WHEN** the user presses Cmd+Y (or Ctrl+Y) or Cmd+Shift+Z (or Ctrl+Shift+Z) and the redo stack is empty
- **THEN** the system SHALL still call `preventDefault()` to prevent the browser from redoing text input outside the editor

#### Scenario: Escape with active selection

- **WHEN** the user presses Escape and one or more steps are selected
- **THEN** the system SHALL call `preventDefault()` and clear the selection

#### Scenario: Escape with no selection

- **WHEN** the user presses Escape and no steps are selected
- **THEN** the system SHALL NOT call `preventDefault()`, allowing the browser default (e.g., close dialog, exit fullscreen)

#### Scenario: Alt+ArrowUp with movable step

- **WHEN** the user presses Alt+ArrowUp and a step is selected that is not the first step
- **THEN** the system SHALL call `preventDefault()` and move the step up

#### Scenario: Alt+ArrowUp with no step or first step

- **WHEN** the user presses Alt+ArrowUp and no step is selected or the selected step is the first step
- **THEN** the system SHALL NOT call `preventDefault()`, allowing native browser scroll or other behavior

#### Scenario: Alt+ArrowDown with movable step

- **WHEN** the user presses Alt+ArrowDown and a step is selected that is not the last step
- **THEN** the system SHALL call `preventDefault()` and move the step down

#### Scenario: Alt+ArrowDown with no step or last step

- **WHEN** the user presses Alt+ArrowDown and no step is selected or the selected step is the last step
- **THEN** the system SHALL NOT call `preventDefault()`, allowing native browser scroll or other behavior

### Requirement: Exact modifier matching

Keyboard shortcuts SHALL only intercept the exact modifier combination they own. Shortcuts with additional modifiers (e.g., Shift) that are not part of the defined shortcut SHALL pass through to the browser.

#### Scenario: Cmd+Shift+C passes through

- **WHEN** the user presses Cmd+Shift+C (or Ctrl+Shift+C)
- **THEN** the system SHALL NOT intercept the event, allowing the browser to open DevTools inspector

#### Scenario: Cmd+Shift+S passes through

- **WHEN** the user presses Cmd+Shift+S (or Ctrl+Shift+S)
- **THEN** the system SHALL NOT intercept the event, allowing the browser to handle it natively

#### Scenario: Cmd+Shift+G is intercepted for ungroup

- **WHEN** the user presses Cmd+Shift+G (or Ctrl+Shift+G) and a repetition block is selected
- **THEN** the system SHALL call `preventDefault()` and ungroup the block (this is an owned shortcut)

#### Scenario: Cmd+Shift+Z is intercepted for redo

- **WHEN** the user presses Cmd+Shift+Z (or Ctrl+Shift+Z)
- **THEN** the system SHALL call `preventDefault()` and perform redo (this is an owned shortcut)

### Requirement: Form and contentEditable element passthrough

Keyboard shortcuts SHALL NOT fire when the focus is on a form element (input, textarea, select) or a contentEditable element. The event SHALL pass through to the browser for native editing behavior.

#### Scenario: Cmd+C in a text input

- **WHEN** the user presses Cmd+C while focused on an `<input>` or `<textarea>`
- **THEN** the system SHALL NOT intercept the event, allowing native text copy within the field

#### Scenario: Cmd+A in a contentEditable element

- **WHEN** the user presses Cmd+A while focused on a `[contenteditable]` element
- **THEN** the system SHALL NOT intercept the event, allowing native text selection within the element

### Requirement: Custom context menu for editor area

The workout editor area SHALL provide a custom right-click context menu with actions relevant to the current state. When no app actions are applicable, the native browser context menu SHALL appear instead. Each menu item SHALL display its corresponding keyboard shortcut hint right-aligned.

#### Scenario: Right-click on a selected item

- **WHEN** the user right-clicks on a workout item (step or block) that is selected
- **THEN** the system SHALL display a custom context menu with at minimum: Cut, Copy, Paste (if clipboard has content), Delete

#### Scenario: Right-click on an unselected item (no multi-selection)

- **WHEN** the user right-clicks on a workout item (step or block) that is not currently selected and no multi-selection is active
- **THEN** the system SHALL select the item and display the custom context menu

#### Scenario: Right-click on an unselected item while multi-selection is active

- **WHEN** the user right-clicks on an item (step or block) that is NOT part of the current multi-selection
- **THEN** the system SHALL replace the selection with the right-clicked item and display the context menu for that single item

#### Scenario: Right-click on an item that is part of a multi-selection

- **WHEN** the user right-clicks on an item (step or block) that IS part of the current multi-selection
- **THEN** the system SHALL keep the multi-selection and display the context menu with actions applicable to all selected items

#### Scenario: Right-click on empty editor area

- **WHEN** the user right-clicks on an empty area of the editor (not on a step) and the clipboard store has step content
- **THEN** the system SHALL display a context menu with Paste and Select All (if steps exist)

#### Scenario: Right-click with no applicable actions

- **WHEN** the user right-clicks on an empty area with no clipboard content and no steps in the workout
- **THEN** the system SHALL NOT show a custom context menu, allowing the native browser context menu to appear

#### Scenario: Context menu Cut action

- **WHEN** the user selects "Cut" from the context menu
- **THEN** the system SHALL copy the selected step to the clipboard store, delete it from the workout, and show a toast confirmation

#### Scenario: Context menu Copy action

- **WHEN** the user selects "Copy" from the context menu
- **THEN** the system SHALL copy the selected step to the clipboard store, same as Cmd+C

#### Scenario: Context menu Paste action

- **WHEN** the user selects "Paste" from the context menu
- **THEN** the system SHALL paste the step from the clipboard store after the currently selected step, or at the end of the step list if no step is selected

#### Scenario: Context menu Delete action

- **WHEN** the user selects "Delete" from the context menu
- **THEN** the system SHALL delete the selected step(s), same as pressing Delete/Backspace (existing keyboard behavior, not modified by this change)

#### Scenario: Context menu Select All action

- **WHEN** the user selects "Select All" from the context menu
- **THEN** the system SHALL select all selectable items in the workout, same as Cmd+A

#### Scenario: Context menu Group action

- **WHEN** the user selects "Group" from the context menu and 2 or more steps are selected
- **THEN** the system SHALL open the create repetition block dialog, same as Cmd+G

#### Scenario: Context menu Ungroup action

- **WHEN** the user selects "Ungroup" from the context menu and a repetition block is selected
- **THEN** the system SHALL ungroup the block into individual steps, same as Cmd+Shift+G

#### Scenario: Focus return after context menu action

- **WHEN** a context menu action completes or the context menu is dismissed without action
- **THEN** focus SHALL return to the step list container. After a Delete action, focus SHALL move to the next step (or the previous step if the last step was deleted). After a Paste action, focus SHALL move to the newly pasted step

#### Scenario: Screen reader announcement of context menu actions

- **WHEN** a context menu action (Cut, Copy, Paste, Delete) completes
- **THEN** a toast notification with `role="status"` SHALL announce the action result to assistive technology (e.g., "Step copied", "Step cut", "Step pasted", "Step deleted")

### Requirement: Clipboard store exposes content check

The clipboard store SHALL expose a synchronous function to check whether it contains step content, without reading or exposing the content itself. This SHALL be used by context menu visibility logic and keyboard shortcut guards.

#### Scenario: Check clipboard has content

- **WHEN** the system queries `hasClipboardContent()`
- **THEN** it SHALL return `true` if the in-memory clipboard store contains step data, `false` otherwise
