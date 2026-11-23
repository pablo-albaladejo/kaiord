## ADDED Requirements

### Requirement: A failure reaches the athlete as a worded reason

A failure reported by a Bridge, a Platform, a Provider or a library SHALL
reach the presentation layer as a typed reason mapped to a dictionary key
in `en` and `es`; its own text SHALL NOT be rendered, and SHALL go only to
the console or local diagnostics. A failure that no reason matches SHALL be
shown as its consequence and "Try again", with no cause stated.

#### Scenario: An extension answers with its own English text

- **GIVEN** Kaiord for Garmin answers a send with "Extension was updated. Please try again."
- **WHEN** the App shows the send's outcome
- **THEN** the athlete SHALL read the dictionary wording for an updated extension, in the active locale, and not the extension's text

#### Scenario: A failure with no known cause

- **GIVEN** a TrainingPeaks send fails with an error no reason matches
- **WHEN** the App shows the outcome
- **THEN** it SHALL say TrainingPeaks is not answering and offer Try again, with no cause

### Requirement: The copy rules see copy built in the same file

`local/no-jsx-literal-text` and `local/no-literal-copy` SHALL also report a
string built with `+`, a `const` string or a function returning text
defined in the same file and rendered or passed as copy, a bare
`toast("…")`, the copy setters `setNotice`, `setWarning`, `setHint`,
`setText`, `setLabel`, `setTitle`, `setDescription` and a `setStatus`
handed prose, the copy props `text`, `tooltip`, `emptyText`, `actionLabel`
and any `*Label`, `*Text` or `*Message` prop, the `value` of an `<input>`
of type submit, button or reset, and the prose values of a `*_NAMES` map.
The single letters A, C, G, V and X SHALL be allowed only on the keyboard
shortcut surfaces, and KRD and GCN only on the import and export file-type
surfaces.

#### Scenario: Copy built with a plus sign

- **GIVEN** a component renders `{"Step " + n}`
- **WHEN** `pnpm lint` runs
- **THEN** it SHALL fail with `local/no-jsx-literal-text`

#### Scenario: A format name outside import and export

- **GIVEN** a component outside the import and export surfaces renders "KRD"
- **WHEN** `pnpm lint` runs
- **THEN** it SHALL fail with `local/no-jsx-literal-text`
