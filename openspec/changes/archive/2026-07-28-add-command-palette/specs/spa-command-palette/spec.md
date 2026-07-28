## ADDED Requirements

### Requirement: One enumerable source of editor commands

The SPA SHALL describe every editor action it offers outside a dedicated form as
one enumerable list of commands, and every surface that offers those actions
SHALL render from that list rather than from its own copy. Each command SHALL
carry a unique id, a display group, an i18n key for its title in the `palette`
namespace with optional interpolation parameters, an optional subtitle key, an
optional shortcut-catalog row id, a live `enabled` flag and a `run` thunk. `run`
SHALL delegate to an existing keyboard-handler thunk, so no surface
re-implements a store action.

#### Scenario: The right-click menu renders from the command list

- **GIVEN** the editor context menu
- **WHEN** it decides which items to show and what they do
- **THEN** it SHALL project the shared command list onto its items, and SHALL NOT hold its own list of actions or its own store calls

#### Scenario: A command runs through the keyboard-handler thunk

- **GIVEN** the `ungroup-block` command
- **WHEN** its `run` is invoked
- **THEN** it SHALL call the `onUngroupBlock` handler thunk, which owns the guard and the store action

#### Scenario: Both surfaces agree on availability

- **GIVEN** a selection of exactly one step
- **WHEN** the palette and the context menu each decide whether grouping is available
- **THEN** both SHALL resolve it from the same `enabled` flag on the same command, and both SHALL treat it as unavailable

#### Scenario: Command shortcut ids resolve in the shortcut catalog

- **GIVEN** a command that names a shortcut row
- **WHEN** its key chips are rendered
- **THEN** the id SHALL resolve to exactly one `SHORTCUT_CATALOG` row, so no second id-to-keys mapping exists

### Requirement: Command availability mirrors the handler's own guard

Each command's `enabled` flag SHALL equal the condition under which its handler
thunk actually performs its action, so a command is never offered when invoking
it would do nothing. Commands SHALL NOT share a guard field with each other,
even where two of them evaluate the same condition, so that tightening one can
never silently change another: cut, copy
and delete each require a top-level step carrying a positional index, cut
additionally requires that no more than one id is selected, paste requires both
clipboard content and a workout to paste into, select-all requires a workout
containing at least one such step, grouping requires two or more selected ids,
ungrouping requires a selected repetition block, and undo, redo and save follow
the history and loaded-workout state. Selected items SHALL be identified by
resolving the selection id against the workout tree, and SHALL NOT be classified
by pattern-matching the id string.

#### Scenario: A repetition block created in the app is recognised as a block

- **GIVEN** a repetition block whose id is a UUID rather than the legacy `block-…` format
- **WHEN** it is selected and the commands are read
- **THEN** ungrouping SHALL be available, and cut, copy and delete SHALL NOT, because none of them can act on a block

#### Scenario: A step inside a block offers no clipboard command

- **GIVEN** a step nested inside a repetition block is selected
- **WHEN** the commands are read
- **THEN** cut, copy and delete SHALL be unavailable, because the clipboard handlers only address top-level steps

#### Scenario: Cut withdraws from a multi-selection

- **GIVEN** two or more selected ids
- **WHEN** the cut command is read
- **THEN** it SHALL be unavailable, because its handler refuses a multi-selection, while copy remains available for the focused step

#### Scenario: Select-all withdraws from a blocks-only workout

- **GIVEN** a workout whose items are all repetition blocks
- **WHEN** the select-all command is read
- **THEN** it SHALL be unavailable, because the handler finds no selectable step

#### Scenario: Paste needs somewhere to paste

- **GIVEN** clipboard content but no loaded workout
- **WHEN** the paste command is read
- **THEN** it SHALL be unavailable

#### Scenario: Grouping needs two steps

- **GIVEN** one step selected
- **WHEN** the group command is read
- **THEN** it SHALL be disabled, and SHALL become enabled once a second step is selected

#### Scenario: The selected count reaches the command title

- **GIVEN** three selected steps
- **WHEN** the group command is read
- **THEN** its title parameters SHALL carry the count `3`, so the row can name what it will act on

#### Scenario: Invoking a disabled command is a no-op

- **GIVEN** the group command with one step selected
- **WHEN** its `run` is invoked anyway
- **THEN** no store action SHALL be performed, because the guard lives in the handler thunk

#### Scenario: Paste follows the clipboard

- **GIVEN** an empty editor clipboard
- **WHEN** the paste command is read
- **THEN** it SHALL be disabled, and SHALL become enabled once a step has been copied or cut

### Requirement: Command rows state what they will actually do

A command row SHALL describe its real effect, and SHALL NOT claim to run an
action it only opens a dialog for. The group command SHALL state that it opens
the repetition-block dialog and SHALL NOT be described as running immediately or
as undoable; no direct-group store action SHALL be added to satisfy the copy.
When a command is unavailable, its subtitle SHALL explain the condition that
would make it available instead of describing the effect.

#### Scenario: Grouping is described as opening a dialog

- **GIVEN** two or more selected steps
- **WHEN** the group row is rendered
- **THEN** its subtitle SHALL say that it opens the repetition-block dialog, not that it runs now

#### Scenario: A disabled row explains its guard

- **GIVEN** fewer than two selected steps
- **WHEN** the group row is rendered
- **THEN** the row SHALL still render, and its subtitle SHALL state that two or more steps must be selected

#### Scenario: A count-free title while the guard is closed

- **GIVEN** one selected step
- **WHEN** the group row's title is rendered
- **THEN** it SHALL use the count-free title, so the row never reads as "the 1 selected steps"

### Requirement: The command palette searches, explains and runs

The SPA SHALL provide a command palette that lists the commands grouped into a
"do" section and a "learn" section, filters them as the user types, and runs the
active command. Filtering SHALL be a case- and accent-insensitive substring
match over the translated title. Each row SHALL render its title, its subtitle
when it has one, and the key chips of its shortcut-catalog row when it names
one. A group with no matching command SHALL NOT render. The palette SHALL be
lazy-mounted so it costs nothing until it is first opened.

#### Scenario: Typing narrows the list

- **GIVEN** the palette open with every command listed
- **WHEN** the user types a word that appears in one command's title
- **THEN** only the matching row SHALL remain, and empty groups SHALL disappear

#### Scenario: Search ignores case and accents

- **GIVEN** a command whose translated title contains an accented character
- **WHEN** the user types the unaccented, lowercased form
- **THEN** the command SHALL match

#### Scenario: No match shows an empty state

- **GIVEN** the palette open
- **WHEN** the query matches no command
- **THEN** the palette SHALL say so rather than render empty groups

#### Scenario: Learn rows open the documentation

- **GIVEN** a row in the "learn" group
- **WHEN** it is run
- **THEN** the documentation page SHALL open in a new tab, and the palette SHALL close

#### Scenario: The footer offers the shortcut sheet and the docs

- **GIVEN** the palette open
- **WHEN** the user reads the footer
- **THEN** it SHALL offer running the active row with Enter, opening the full shortcut sheet, and a link to the documentation site

### Requirement: The palette is driven from the keyboard without losing the query

Arrow keys SHALL move the active row and Enter SHALL run it; `Escape` SHALL
close the palette. Keyboard focus SHALL remain in the search input while the
active row moves, so typing continues to filter, and the active row SHALL be
published to assistive technology through `aria-activedescendant` rather than by
moving focus. A disabled row SHALL be reachable as an active row but SHALL NOT
be runnable, by keyboard or by pointer.

#### Scenario: Arrow keys move the active row

- **GIVEN** the palette open with the first row active
- **WHEN** the user presses ArrowDown then ArrowUp
- **THEN** the active row SHALL move to the second row and back to the first

#### Scenario: Enter runs the active command and closes

- **GIVEN** an enabled row is active
- **WHEN** the user presses Enter
- **THEN** the command SHALL run and the palette SHALL close

#### Scenario: Enter on a disabled row does nothing

- **GIVEN** a disabled row is active
- **WHEN** the user presses Enter
- **THEN** no command SHALL run and the palette SHALL stay open

#### Scenario: Clicking a disabled row does nothing

- **GIVEN** a disabled row
- **WHEN** the user clicks it
- **THEN** no command SHALL run, and the row SHALL be marked disabled to assistive technology

#### Scenario: Focus stays in the search input

- **GIVEN** the palette open
- **WHEN** the user moves the active row with the arrow keys
- **THEN** the search input SHALL keep focus and SHALL name the active row via `aria-activedescendant`

#### Scenario: Escape closes the palette

- **GIVEN** the palette open
- **WHEN** the user presses Escape
- **THEN** the palette SHALL request to close

### Requirement: Ctrl+K opens the palette even while typing

`Ctrl+K` and `⌘K` SHALL open the command palette, and SHALL do so regardless of
whether the event target is a form field — unlike every other binding, which is
suppressed inside inputs, textareas, selects and contenteditable regions. The
binding SHALL be dispatched from the SPA's existing global keydown chain ahead
of the form-field guard, SHALL only call `preventDefault()` when its handler
reports that it handled the event, and SHALL NOT match when `Shift` or `Alt` is
held. Adding the binding SHALL NOT change the behaviour of any existing
shortcut, including the `?` sheet's own form-field suppression.

#### Scenario: The palette opens from inside a text field

- **GIVEN** focus inside a workout-name input
- **WHEN** the user presses `⌘K`
- **THEN** the palette SHALL open, because this binding is dispatched before the form-field guard

#### Scenario: The palette opens from inside a contenteditable region

- **GIVEN** focus inside a contenteditable element
- **WHEN** the user presses `Ctrl+K`
- **THEN** the palette SHALL open

#### Scenario: Unmodified k is passed through

- **WHEN** the user presses `k` with no modifier
- **THEN** the palette SHALL NOT open, and the character SHALL reach whatever has focus

#### Scenario: Shift and Alt variants are not claimed

- **WHEN** the user presses `Ctrl+Shift+K` or `Ctrl+Alt+K`
- **THEN** the palette SHALL NOT open, and the chord SHALL fall through to the browser

#### Scenario: Existing bindings are unaffected

- **GIVEN** both the palette handler and the editor handlers are bound
- **WHEN** the user presses `Ctrl+S`, `Ctrl+C` or `Ctrl+G` outside a form field
- **THEN** the matching editor handler SHALL be called and the palette handler SHALL NOT

#### Scenario: `?` keeps its form-field guard

- **GIVEN** focus inside a text field and both bindings bound
- **WHEN** the user types `?`
- **THEN** the shortcut sheet SHALL NOT open, because only the palette binding sits ahead of the guard

#### Scenario: The binding is documented by the catalog

- **GIVEN** the palette handler added to the handler surface
- **WHEN** the shortcut-catalog parity test runs
- **THEN** it SHALL require a `help`-group catalog row for the binding, so the palette shortcut cannot ship undocumented

### Requirement: The palette namespace covers every command in every locale

Every command title, enabled subtitle and closed-guard subtitle SHALL resolve in
the `palette` i18n namespace, and the namespace SHALL exist at key parity across
every supported locale. No command copy SHALL be hardcoded in a component.

#### Scenario: Every rendered key resolves

- **GIVEN** the full command list
- **WHEN** its title and subtitle keys are resolved against the English `palette` namespace
- **THEN** every key SHALL resolve to a string

#### Scenario: Locales stay at parity

- **GIVEN** the `palette` namespace added for English
- **WHEN** the resource-parity test runs
- **THEN** every other supported locale SHALL expose the identical key tree
