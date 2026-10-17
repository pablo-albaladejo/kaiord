## MODIFIED Requirements

### Requirement: MCP tool errors SHALL be machine-branchable

Every MCP tool failure response SHALL carry, in addition to the human-readable text, a machine-readable error classification (a stable `type` drawn from a shared vocabulary: file-not-found, unsupported-format, validation, tolerance, auth, service, environment, missing-ftp, unknown) and, where a remediation exists, a `suggestion`. Health-family tools SHALL share one response contract including the `skipped` count.

#### Scenario: An agent can branch on the failure type

- **GIVEN** `kaiord_convert` fails because the requested output format is unsupported
- **WHEN** the tool responds with `isError: true`
- **THEN** the response carries a stable machine-readable type identifying the unsupported-format failure distinct from a parse or auth failure

#### Scenario: Missing FTP is reported as its own type

- **GIVEN** `kaiord_convert` is asked for GCN output from a workout with percent-of-FTP power targets and no `ftp`
- **WHEN** the tool responds with `isError: true`
- **THEN** the response carries the `missing-ftp` type and a suggestion to pass `ftp`

#### Scenario: Recovery status reports skipped inputs like its siblings

- **WHEN** `kaiord_get_recovery_status` processes inputs of which some cannot be parsed
- **THEN** its response payload includes the `skipped` count, matching the other health-history tools
