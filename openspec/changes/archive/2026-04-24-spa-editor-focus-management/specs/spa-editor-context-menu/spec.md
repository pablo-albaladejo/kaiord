## Application Notes

**Prose removal:** The existing `openspec/specs/spa-editor-context-menu/spec.md` contains the following prose block immediately after the "Focus return after context menu dismissal" scenario:

> **Future enhancement**: Smart focus management (focus next step after Delete, focus pasted step after Paste) is tracked as a separate cross-cutting change (`spa-editor-focus-management`) that will apply holistically across all input methods (keyboard, context menu, toolbar, drag-and-drop).

When this delta is applied, that prose block SHALL be removed because the future enhancement is delivered by the `spa-editor-focus-management` capability added in this change.

**Cross-reference (single-parent selection invariant):** `spa-editor-focus-management` adds an invariant that multi-selection cannot span the main workout list and the inside of a repetition block simultaneously. Existing context-menu scenarios that assume a multi-selection (e.g., "Right-click on an item that is part of a multi-selection") continue to apply, but the selection is guaranteed to share a single parent. No context-menu scenario text change is required; this note is for readers of the context-menu spec who want to understand why a cross-parent multi-selection case is not enumerated.

## MODIFIED Requirements

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

#### Scenario: Focus return after context menu dismissal without mutation

- **WHEN** a context menu is dismissed without invoking an action that mutates the step list (e.g., Escape, click outside, or invoking Copy/Select All which do not change list contents)
- **THEN** focus SHALL return to the previously-focused element via Radix ContextMenu default behavior

#### Scenario: Focus return after context menu action that mutates the list

- **WHEN** a context menu action that mutates the step list completes (Cut, Paste, Delete, Group, Ungroup)
- **THEN** focus SHALL move to the target dictated by the `spa-editor-focus-management` capability's `pendingFocusTarget` rules (e.g., next sibling after Cut/Delete, pasted item after Paste, new block after Group) rather than returning to the previously-focused element

#### Scenario: Screen reader announcement of context menu actions

- **WHEN** a context menu action (Cut, Copy, Paste, Delete) completes
- **THEN** a toast notification with `role="status"` SHALL announce the action result to assistive technology (e.g., "Step copied", "Step cut", "Step pasted", "Step deleted")
