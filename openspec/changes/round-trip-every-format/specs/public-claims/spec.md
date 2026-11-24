## ADDED Requirements

### Requirement: A Round-trip claim is proven per format

A register entry whose text says Round-trip, lossless, or that every value is
kept (English or Spanish) SHALL be proven by the Round-trip contract test of
every format it names, as listed in `scripts/lib/round-trip-formats.vocab.mjs`
(FIT, TCX, ZWO, GCN), a format being read in any case by its name, common name
(Zwift, Garmin Connect, Training Center) or file extension. An entry that names
no format SHALL cite a test of every format's contract. `pnpm lint:claims`
SHALL fail on such an entry without that proof, on one that names a format no
Round-trip test covers (WHOOP, Tanita, TrainingPeaks and Train2Go, which the
Kaiord SDK reads but does not write; ERG, MRC or any other file extension it
neither reads nor writes; KRD JSON), on a label that names a format, and when a
listed format's package has no shard in the CI `round-trip` job. The public
text SHALL say "Round-trip tested" and name the fields the format cannot carry;
"lossless" stays a retired term.

#### Scenario: A format named in lower case or by its extension

- **WHEN** a registered sentence says "Round-trip tested for .fit files" without the FIT contract test as proof
- **THEN** `pnpm lint:claims` SHALL fail and name the FIT contract test

#### Scenario: A Round-trip claim that names no format

- **WHEN** a registered sentence says every format has a Round-trip test and its entry does not cite the ZWO contract test
- **THEN** `pnpm lint:claims` SHALL fail and name the ZWO contract test

#### Scenario: A format without a Round-trip test

- **WHEN** a registered sentence claims a Round-trip for WHOOP, ERG or KRD JSON
- **THEN** `pnpm lint:claims` SHALL fail and name the claim

#### Scenario: The proving test is not the format's own

- **WHEN** a sentence claims a Round-trip for TCX and its entry is proven by another test
- **THEN** `pnpm lint:claims` SHALL fail and name the TCX contract test

#### Scenario: A format leaves the CI round-trip job

- **WHEN** the `round-trip` job's matrix drops the `zwo` package
- **THEN** `pnpm lint:claims` SHALL fail
