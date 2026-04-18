## MODIFIED Requirements

### Requirement: Cost estimation before batch processing

The system SHALL display an estimated token count and cost before the user confirms batch processing.

#### Scenario: Batch confirmation dialog

- **WHEN** the user clicks "Process all with AI" on the calendar
- **THEN** the system SHALL display a confirmation with: provider name, estimated tokens (chars/3 heuristic), estimated cost based on provider rates, and "This is an estimate" disclaimer

#### Scenario: Confirmation dialog renders before dispatch

- **WHEN** the user clicks "Process all with AI" on a batch of N RAW workouts
- **THEN** the system SHALL render a `BatchCostConfirmation` dialog before dispatching to the batch processor, and the dialog SHALL show (a) the configured provider name, (b) the total estimated input + output tokens across the batch (via `estimateTokens`), (c) the estimated USD cost (via `estimateCost`), (d) a visible disclaimer string containing "estimate", and (e) Confirm and Cancel controls
- **AND** clicking Cancel SHALL abort the batch without writing any `UsageRecord`
- **AND** clicking Confirm SHALL dispatch to the existing batch processor

### Requirement: Monthly AI usage tracking

The system SHALL track AI token usage per calendar month in Dexie, keyed by year-month (e.g., "2026-04").

#### Scenario: View usage in settings

- **WHEN** the user opens Settings > AI tab
- **THEN** the system SHALL display cumulative token usage and estimated cost for the current month

#### Scenario: Usage panel shows current + previous five months

- **WHEN** the user opens Settings > Usage (or the equivalent panel tied to the `UsageRecord` Dexie store)
- **THEN** the panel SHALL render one row per `(yearMonth, provider)` for the current month and the five preceding months, each row showing provider, inputTokens, outputTokens, and costUsd
- **AND** the data SHALL be read via `useLiveQuery` (no manual refetch) so the panel updates live after each batch run
- **AND** months with no usage SHALL NOT render as empty rows
