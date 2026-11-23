## ADDED Requirements

### Requirement: A Round-trip claim is proven per format

A register entry whose text says Round-trip and names a format SHALL be proven
by the Round-trip contract test of every format it names, as listed in
`scripts/lib/round-trip-formats.vocab.mjs` (FIT, TCX, ZWO, GCN). `pnpm lint:claims`
SHALL fail on such an entry without that proof, on one that names a format the
Kaiord SDK reads but does not write (WHOOP, Tanita, TrainingPeaks, Train2Go),
on a label that names a format, and when a listed format's package has no shard
in the CI `round-trip` job. The public text SHALL say "Round-trip tested" and
name the fields the format cannot carry; "lossless" stays a retired term.

#### Scenario: A format without a Round-trip test

- **WHEN** a registered sentence claims a Round-trip for WHOOP
- **THEN** `pnpm lint:claims` SHALL fail and name the claim

#### Scenario: The proving test is not the format's own

- **WHEN** a sentence claims a Round-trip for TCX and its entry is proven by another test
- **THEN** `pnpm lint:claims` SHALL fail and name the TCX contract test

#### Scenario: A format leaves the CI round-trip job

- **WHEN** the `round-trip` job's matrix drops the `zwo` package
- **THEN** `pnpm lint:claims` SHALL fail
