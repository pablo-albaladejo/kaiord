## ADDED Requirements

### Requirement: Single catalog of keyboard shortcuts

The SPA SHALL describe every keyboard binding it ships in one declarative
catalog, and every surface that documents shortcuts SHALL render from that
catalog rather than from hand-written literals. Each catalog row SHALL carry a
unique id, a display group, the platform-default keys, optional mac keys,
optional alias keys for a secondary binding of the same action, an i18n label
key in the `help` namespace, and the handler it documents (or `null` when the
binding has no handler).

#### Scenario: The Help page renders from the catalog

- **GIVEN** the keyboard-shortcuts section of the Help page
- **WHEN** it renders a group
- **THEN** it SHALL render one row per catalog entry in that group, with the row's translated label and its key chips

#### Scenario: A binding is documented once

- **GIVEN** the `Ctrl+Shift+Z` redo binding
- **WHEN** it is added to the catalog
- **THEN** it SHALL be expressed as alias keys on the existing redo row, not as a second row for the same action

#### Scenario: Group headings resolve from the group id

- **GIVEN** a catalog row in the `steps` group
- **WHEN** its group heading is rendered
- **THEN** the heading SHALL be resolved from the `shortcuts.steps.heading` key of the `help` namespace

### Requirement: Catalog and handler surface are paired mechanically

The catalog SHALL be paired to `KeyboardShortcutHandlers` by an automated test,
so a handler cannot be added, renamed or removed without the catalog following.
A runtime list of handler keys SHALL be derived from a mapping that is
exhaustive over `keyof KeyboardShortcutHandlers` in both directions, so that a
missing entry and a stale entry are each a compile-time error. The test SHALL
assert that every handler key appears as the `handlerKey` of exactly one catalog
row, that no row names a handler that does not exist, and that every label key
in the catalog resolves to a string in the English `help` namespace.

#### Scenario: A new handler without a catalog row fails the suite

- **GIVEN** a new key added to `KeyboardShortcutHandlers` and to the handler-key mapping
- **WHEN** the shortcut-catalog test runs without a matching catalog row
- **THEN** the test SHALL fail, reporting that the handler is documented by zero rows

#### Scenario: A duplicated handler row fails the suite

- **GIVEN** two catalog rows whose `handlerKey` is `onCopy`
- **WHEN** the shortcut-catalog test runs
- **THEN** the test SHALL fail, because the handler must be documented by exactly one row

#### Scenario: A label key missing from the catalog's namespace fails the suite

- **GIVEN** a catalog row whose `labelKey` has no entry in `locales/en/help.json`
- **WHEN** the shortcut-catalog test runs
- **THEN** the test SHALL fail, because every documented shortcut must have a translatable label

#### Scenario: A removed handler leaves no stale row

- **GIVEN** a handler key deleted from `KeyboardShortcutHandlers`
- **WHEN** the handler-key mapping is not updated
- **THEN** type-checking SHALL fail, because the mapping is exhaustive over the handler type

### Requirement: The `?` key opens the shortcut sheet

Pressing `?` SHALL open a shortcut sheet that renders the catalog grouped for
reading, without navigating away from the current view. The sheet SHALL be
lazy-mounted, SHALL display the shortcut keys for the viewer's platform, and
SHALL be dismissible with `Escape` and with an explicit close control. The
binding SHALL be dispatched from the SPA's existing global keydown chain, and
SHALL match the character `?` rather than a fixed modifier-plus-key combination.

#### Scenario: Pressing ? opens the sheet

- **GIVEN** the editor with focus outside any form field
- **WHEN** the user presses `?`
- **THEN** the shortcut sheet SHALL open, showing every catalog group with its rows and key chips

#### Scenario: The sheet closes on Escape

- **GIVEN** the shortcut sheet is open
- **WHEN** the user presses `Escape`
- **THEN** the sheet SHALL request to close

#### Scenario: The sheet documents its own binding

- **GIVEN** the shortcut sheet is open
- **WHEN** the user reads the help group
- **THEN** the `?` binding SHALL appear as a documented row, because it is a handler like any other

### Requirement: The shortcut sheet respects the form-field guard

The `?` binding SHALL NOT fire while the event target is a form field —
`input`, `textarea`, `select`, or a contenteditable element — so a literal `?`
typed into a field reaches the field. It SHALL NOT fire when a `Ctrl` or `Meta`
modifier is held. It SHALL only call `preventDefault()` when its handler reports
that it handled the event, matching the contract of every other binding in the
chain. Adding the binding SHALL NOT change the behaviour of any existing
shortcut.

#### Scenario: Typing ? into a text field does not open the sheet

- **GIVEN** focus inside a workout-name input
- **WHEN** the user types `?`
- **THEN** the sheet SHALL NOT open and the character SHALL reach the input

#### Scenario: Typing ? into a contenteditable region does not open the sheet

- **GIVEN** focus inside a contenteditable element
- **WHEN** the user presses `?`
- **THEN** the sheet SHALL NOT open

#### Scenario: Modified ? is passed through

- **WHEN** the user presses `Ctrl+?` or `Cmd+?`
- **THEN** the sheet SHALL NOT open, because the binding is unmodified `?` only

#### Scenario: AltGr layouts still open the sheet

- **GIVEN** a keyboard layout where `?` is produced with AltGr (reported as `ctrlKey+altKey` or the `AltGraph` modifier state)
- **WHEN** the user types `?`
- **THEN** the sheet SHALL open, because AltGr-produced characters dispatch as plain keys, never as Ctrl shortcuts

#### Scenario: Existing bindings are unaffected

- **GIVEN** both `onDelete` and the `?` handler are bound
- **WHEN** the user presses `Delete` with focus outside a form field
- **THEN** `onDelete` SHALL be called and the `?` handler SHALL NOT

### Requirement: Platform detection without deprecated APIs

The SPA SHALL determine whether the viewer is on macOS from
`navigator.userAgentData.platform`, falling back to `navigator.userAgent`, and
SHALL NOT read the deprecated `navigator.platform`. Shortcut rendering SHALL use
the catalog's mac keys on macOS when a row defines them, and the default keys
otherwise.

#### Scenario: userAgentData is preferred over the user-agent string

- **GIVEN** `navigator.userAgentData.platform` reports `Windows` while the user-agent string mentions `Macintosh`
- **WHEN** the platform is detected
- **THEN** the viewer SHALL NOT be treated as macOS

#### Scenario: The user-agent string is the fallback

- **GIVEN** a browser that does not expose `navigator.userAgentData`
- **WHEN** the user-agent string mentions `Macintosh`
- **THEN** the viewer SHALL be treated as macOS

#### Scenario: A row without mac keys falls back to its default keys

- **GIVEN** the clear-selection row, which defines `Esc` and no mac keys
- **WHEN** it renders on macOS
- **THEN** it SHALL render `Esc`
