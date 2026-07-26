## MODIFIED Requirements

### Requirement: Monthly AI usage tracking

The system SHALL track AI token usage per calendar month by folding the synced `usageEvents` log, not a dedicated `usage` Dexie table. The Settings usage panel reads `usageEvents` for the current month plus the previous five, folds each month via `foldUsageEvents`, and displays cumulative input/output/total tokens, estimated cost, and a per-purpose breakdown — read live via `useLiveQuery`.

#### Scenario: View usage in settings

- **WHEN** the user opens Settings > Usage
- **THEN** the system SHALL display cumulative token usage and estimated cost for the current month, folded from `usageEvents`

#### Scenario: Usage panel shows current + previous five months

- **WHEN** the user opens Settings > Usage
- **THEN** the panel SHALL render one row per month for the current month and the five preceding months, each row showing input, output, and total tokens plus estimated cost folded from that month's `usageEvents`
- **AND** the data SHALL be read via `useLiveQuery` (no manual refetch) so the panel updates live after each AI run
- **AND** months with no events SHALL NOT render as empty rows
