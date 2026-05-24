# Adapter Coverage Matrix

This document is the **normative artefact** for which KRD `type` each format
adapter in the Kaiord monorepo supports, and in which direction.

It is consulted by contributors who add new conversion paths and by CI guards
that decide which cross-format round-trip tests are valid. When an adapter is
added or extended, **update this file in the same change**.

## Cell values

| Value        | Meaning                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read+write` | The adapter parses this KRD type from its native format AND emits the format back from this KRD type. Cross-format round-trip is required only between `read+write` cells.            |
| `read-only`  | The adapter can parse this KRD type from its native format but does not emit it. (No adapter is in this state today.)                                                                 |
| `write-only` | The adapter can emit this KRD type into its native format but does not parse it back. (No adapter is in this state today.)                                                            |
| `reject`     | The adapter explicitly refuses to write this KRD type, throwing `UnsupportedKrdTypeError` with the offending `krd.type` and the adapter name. The reader never emits this `krd.type`. |
| `n/a`        | The native format does not define a representation for this KRD type (the cell cannot be filled by any future change to this adapter without inventing a private dialect).            |

## Coverage matrix — KRD v2.0

| Format | structured_workout | recorded_activity | course     | sleep_record | weight_measurement | hrv_summary | daily_wellness | body_composition | stress_episode |
| ------ | ------------------ | ----------------- | ---------- | ------------ | ------------------ | ----------- | -------------- | ---------------- | -------------- |
| FIT    | read+write         | read+write        | read+write | read+write   | read+write         | read+write  | read+write     | read+write       | read+write     |
| TCX    | read+write         | read+write        | n/a        | reject       | reject             | reject      | reject         | reject           | reject         |
| ZWO    | read+write         | n/a               | n/a        | reject       | reject             | reject      | reject         | reject           | reject         |
| GCN    | read+write         | n/a               | n/a        | reject       | reject             | reject      | reject         | reject           | reject         |

## Cross-format round-trip rule

A cross-format round-trip test (`format A → KRD → format B → KRD → format A`)
is only valid when **both** the source and the target cells are `read+write`
for the involved KRD type.

The CI suite SHALL NOT attempt:

- `FIT (health type) → TCX → FIT` (TCX rejects every health type)
- `FIT (health type) → GCN → FIT` (GCN rejects every health type)
- `FIT (health type) → ZWO → FIT` (ZWO rejects every health type)

Workout cross-format round-trips (`structured_workout`) remain fully supported
across FIT ↔ TCX ↔ ZWO ↔ GCN via the existing round-trip tolerances
(time ±1 s, power ±1 W or ±1 %FTP, HR ±1 bpm, cadence ±1 rpm).

## Health-only round-trip

The FIT adapter is the only `read+write` implementation for the six health
KRD types in v2.0. Round-trip tests for those types are FIT-only:

- `FIT (health type) → KRD → FIT` must preserve the metric within the
  per-metric tolerances declared by the `health-data` capability
  (see `packages/core/src/domain/schemas/health/tolerances.ts`).

Non-Garmin sources (WHOOP, Oura, Apple Health, Strava wellness) may later be
added as additional `read+write` rows under the same six columns. Each
addition is a separate change that updates this matrix.

## Programmatic check

The six health `FileType` variants are enumerated at
`packages/core/src/domain/schemas/file-type.ts` as `healthFileTypes`, and a
type guard `isHealthFileType(value)` lets callers branch on the partition.
The three workout-only writers use it to short-circuit at the start of every
write call:

```typescript
if (isHealthFileType(krd.type)) {
  throw createUnsupportedKrdTypeError(krd.type, "tcx" /* | "zwo" | "garmin" */);
}
```

This is the single source of truth for the `reject` cells above; the matrix
is a human-readable projection of that guard.
