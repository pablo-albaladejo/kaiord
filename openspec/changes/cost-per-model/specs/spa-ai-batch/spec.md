## MODIFIED Requirements

### Requirement: Cost estimation before batch processing

The system SHALL display an estimated token count and cost before the user confirms batch processing. Each workout SHALL be estimated as its own request, as the batch sends it: its input is the workout-parser system prompt plus the workout's description and comments at 3 characters a token, its output a fixed allowance. The cost SHALL be priced with `priceRun` over those requests, each on its own, at the prices of the model the batch runs on (the one resolved for `workout_generation`), so a long-context tier applies only to a workout whose own request crosses it. When that model has no price the dialog SHALL say the price is unknown instead of showing a cost.

#### Scenario: Batch confirmation dialog

- **WHEN** the user clicks "Process all with AI" on the calendar
- **THEN** the system SHALL display a confirmation with: provider name, estimated tokens (chars/3 heuristic plus the output allowance), estimated cost at the model's own input and output prices, and "This is an estimate" disclaimer

#### Scenario: Confirmation dialog renders before dispatch

- **WHEN** the user clicks "Process all with AI" on a batch of N RAW workouts
- **THEN** the system SHALL render a `BatchCostConfirmation` dialog before dispatching to the batch processor, and the dialog SHALL show (a) the configured provider name, (b) the total estimated input + output tokens across the batch (via `estimateWorkoutRequests`), (c) the estimated USD cost (via `priceRun` over the requests of `estimateWorkoutRequests`), or "Price unknown for this model", (d) a visible disclaimer string containing "estimate", and (e) Confirm and Cancel controls
- **AND** clicking Cancel SHALL abort the batch without writing any `UsageRecord`
- **AND** clicking Confirm SHALL dispatch to the existing batch processor

#### Scenario: The estimate uses the model's own prices

- **GIVEN** a provider whose model is `claude-sonnet-5` and one RAW workout estimated at N input and 500 output tokens, the system prompt included
- **WHEN** the dialog renders
- **THEN** the estimated cost SHALL be (N × $2 + 500 × $10) per million tokens

#### Scenario: Each workout is priced as its own request

- **GIVEN** a batch of three workouts on `claude-haiku-5-5` whose requests are each under 100K input tokens but together over it
- **WHEN** the dialog renders
- **THEN** every request SHALL be priced at Haiku 5.5's base price ($0.10 input, $0.50 output per million tokens), not at its long-context price

### Requirement: Monthly AI usage tracking

The system SHALL track AI token usage per calendar month by folding this device's `usageEvents` log (device-local: not in Drive sync nor a backup file), not a dedicated `usage` Dexie table. The Settings usage panel reads `usageEvents` for the current month plus the previous five, folds each month via `foldUsageEvents`, and displays cumulative input/output/total tokens, estimated cost, and a per-purpose breakdown — read live via `useLiveQuery`.

#### Scenario: View usage in settings

- **WHEN** the user opens Settings > Usage
- **THEN** the system SHALL display cumulative token usage and estimated cost for the current month, folded from `usageEvents`

#### Scenario: Usage panel shows current + previous five months

- **WHEN** the user opens Settings > Usage
- **THEN** the panel SHALL render one row per month for the current month and the five preceding months, each row showing input, output, and total tokens plus estimated cost folded from that month's `usageEvents`
- **AND** the data SHALL be read via `useLiveQuery` (no manual refetch) so the panel updates live after each AI run
- **AND** months with no events SHALL NOT render as empty rows
