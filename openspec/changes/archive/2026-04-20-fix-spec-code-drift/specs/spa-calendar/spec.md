## ADDED Requirements

### Requirement: BatchProgress carries per-workout status

The `Batch processing progress` scenario in `Batch AI processing banner` SHALL be implementable in code: `BatchProgress` (exported from the SPA batch processor) SHALL expose a `byId` map from workout id to one of `"queued" | "processing" | "succeeded" | "failed"` so the calendar UI can label each card individually, and a `counts` object with the same four buckets so the banner can render `Processing X of N` without re-deriving the aggregate.

#### Scenario: Progress shape has byId and counts

- **WHEN** the batch processor dispatches a batch of N workouts
- **THEN** `BatchProgress` SHALL be shaped as `{ total: N, counts: { queued, processing, succeeded, failed }, current: string | null, byId: Record<string, 'queued' | 'processing' | 'succeeded' | 'failed'> }`
- **AND** every workout in the batch SHALL appear as a key in `byId` from the moment the batch begins, initially with status `"queued"`

#### Scenario: Per-workout status transitions

- **GIVEN** a batch in progress with workout W in status `"queued"`
- **WHEN** the processor begins W
- **THEN** `byId[W]` SHALL transition to `"processing"` and `current` SHALL equal W
- **AND** on completion `byId[W]` SHALL transition to `"succeeded"` or `"failed"` and the corresponding `counts.*` SHALL increment by one
