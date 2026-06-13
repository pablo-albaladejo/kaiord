> Synced: 2026-06-13 (code-semantics-hardening)

# Failure Semantics

## Purpose

Defines the user- and agent-facing failure contract: the CLI classifies every
failure through one typed exit-code mapper (keyed on error class/name, never
message text) with distinct categories for user error, environmental breakage,
external-service failure, and unknown bugs; the CLI format vocabulary has a
single source; and MCP tools return machine-readable error payloads an agent
can branch on.

## Requirements

### Requirement: The CLI SHALL classify every failure through one typed exit-code mapper

The CLI SHALL contain exactly one error-to-exit-code mapper, keyed on error class (`instanceof`) or `error.name` — never on message-text substrings. Every command handler SHALL route failures through it. Each exit code defined in the exit-code table SHALL be reachable from at least one production code path; message wording changes MUST NOT change exit codes.

#### Scenario: Identical failure yields identical exit code across commands

- **GIVEN** the same file-not-found failure raised during `convert`, `validate`, and `inspect`
- **WHEN** each command terminates
- **THEN** all three exit with the same semantic code

#### Scenario: Rewording an error message does not change its exit code

- **WHEN** the human-readable text of a thrown domain error is reworded
- **THEN** the process exit code for that failure is unchanged

#### Scenario: Directory-creation failure uses its dedicated code

- **WHEN** the CLI cannot create the requested output directory
- **THEN** the process SHALL exit with the directory-create error code, not the unknown-error code

### Requirement: Environmental and external-service failures SHALL be distinguishable from user error and bugs

The CLI exit-code vocabulary SHALL include a code for environmental failures (missing bundled schema or unresolvable dependency — an installation problem) whose message tells the user to reinstall, and a code for external-service failures (Garmin Connect API or network errors) whose message tells the user the service call failed and may be retried. Neither SHALL fall through to the unknown-error code.

#### Scenario: Missing bundled schema exits as an installation problem

- **GIVEN** a conversion requires a packaged XSD schema file that is absent from the installation
- **WHEN** the conversion fails
- **THEN** the CLI SHALL exit with the environment-error code
- **AND** stderr SHALL identify it as an installation problem with a reinstall suggestion, not an opaque library message

#### Scenario: Garmin service failure exits as a service error

- **GIVEN** Garmin Connect responds with a server error during `garmin push`
- **WHEN** the command terminates
- **THEN** the CLI SHALL exit with the service-error code and a retry-later message, not the unknown-error code

### Requirement: The CLI format vocabulary SHALL have a single source

Format facts consumed by the CLI — codes, extensions, binary-ness, human descriptions — SHALL derive from one registry module. Argument validation, format detection, converter dispatch, and every "Supported formats" message SHALL reference it; a format code appearing as a string literal outside the registry (excluding tests) is a violation.

#### Scenario: Adding a format is a one-module change

- **WHEN** a new format entry is added to the CLI format registry
- **THEN** argument choices, detection, dispatch wiring, and supported-format messages reflect it without editing duplicated literals

### Requirement: MCP tool errors SHALL be machine-branchable

Every MCP tool failure response SHALL carry, in addition to the human-readable text, a machine-readable error classification (a stable `type` drawn from a shared vocabulary: file-not-found, unsupported-format, validation, tolerance, auth, service, environment, unknown) and, where a remediation exists, a `suggestion`. Health-family tools SHALL share one response contract including the `skipped` count.

#### Scenario: An agent can branch on the failure type

- **GIVEN** `kaiord_convert` fails because the requested output format is unsupported
- **WHEN** the tool responds with `isError: true`
- **THEN** the response carries a stable machine-readable type identifying the unsupported-format failure distinct from a parse or auth failure

#### Scenario: Recovery status reports skipped inputs like its siblings

- **WHEN** `kaiord_get_recovery_status` processes inputs of which some cannot be parsed
- **THEN** its response payload includes the `skipped` count, matching the other health-history tools
