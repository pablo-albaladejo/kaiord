## MODIFIED Requirements

### Requirement: Cost estimation before batch processing

The system SHALL display an estimated token count and cost before the user confirms batch processing. The input tokens SHALL be estimated with the chars/3 heuristic and the output with a fixed allowance per workout, and the cost SHALL be priced with `priceRun` at the input and output prices of the provider's model. When that model has no price the dialog SHALL say the price is unknown instead of showing a cost.

#### Scenario: Batch confirmation dialog

- **WHEN** the user clicks "Process all with AI" on the calendar
- **THEN** the system SHALL display a confirmation with: provider name, estimated tokens (chars/3 heuristic plus the output allowance), estimated cost at the model's own input and output prices, and "This is an estimate" disclaimer

#### Scenario: Confirmation dialog renders before dispatch

- **WHEN** the user clicks "Process all with AI" on a batch of N RAW workouts
- **THEN** the system SHALL render a `BatchCostConfirmation` dialog before dispatching to the batch processor, and the dialog SHALL show (a) the configured provider name, (b) the total estimated input + output tokens across the batch (via `estimateTokenSplit`), (c) the estimated USD cost (via `priceRun` over `estimateTokenSplit`), or "Price unknown for this model", (d) a visible disclaimer string containing "estimate", and (e) Confirm and Cancel controls
- **AND** clicking Cancel SHALL abort the batch without writing any `UsageRecord`
- **AND** clicking Confirm SHALL dispatch to the existing batch processor

#### Scenario: The estimate uses the model's own prices

- **GIVEN** a provider whose model is `claude-sonnet-5` and one RAW workout estimated at 1 input and 500 output tokens
- **WHEN** the dialog renders
- **THEN** the estimated cost SHALL be $0.005002
