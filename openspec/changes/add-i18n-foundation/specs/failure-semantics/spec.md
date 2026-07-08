## ADDED Requirements

### Requirement: Validation errors SHALL carry stable machine codes

Core validation failures SHALL include an optional, stable, language-free
`code` (snake_case, e.g. `min_gt_max`, `duration_type_mismatch`, `required`)
on each `ValidationError` entry carried by `KrdValidationError`, alongside
the human-readable English `message`. Codes SHALL be derived from
zod issue codes or assigned explicitly by custom refinements. Message wording
changes MUST NOT change codes. Presentation layers (SPA today, CLI/MCP output
localization later) SHALL branch on error class or `code` — never on message
text — extending this spec's existing exit-code-mapper rule to display copy.
Entries without a `code` remain valid; consumers SHALL treat them as
unmapped and surface the English `message` as-is.

#### Scenario: Custom refinement emits a stable code

- **GIVEN** a KRD whose power target has `min > max`
- **WHEN** validation fails
- **THEN** the resulting `ValidationError` entry SHALL carry `code: "min_gt_max"` in addition to its English `message`

#### Scenario: Rewording a message does not change its code

- **GIVEN** a validation rule whose `message` text is edited
- **WHEN** the same violation occurs after the edit
- **THEN** the emitted `code` SHALL be identical to the pre-edit code

#### Scenario: Codeless entry surfaces its English message

- **GIVEN** a `ValidationError` entry without a `code`
- **WHEN** a presentation layer renders it
- **THEN** the English `message` SHALL be surfaced as-is (no key lookup, no message-text matching)

#### Scenario: Branching on message text is a violation

- **WHEN** consumer code selects display copy by matching a substring of a validation `message`
- **THEN** the change SHALL be rejected; the branch MUST use `code` or the error class
