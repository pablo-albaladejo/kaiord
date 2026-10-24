# Tasks

## 1. Estimator (D1–D3)

- [x] 1.1 Tokenise durations (minutes, seconds, hours) and reject distance-measured segments
- [x] 1.2 Resolve a segment's zone: explicit zone → RPE → intensity-word table, ranges to the lower bound
- [x] 1.3 Expand repeat notation, including set rest `R: N'` between repeats
- [x] 1.4 Keep unzoned spans as `zone: null`; return empty when nothing is zoned or a distance appears; merge consecutive same-zone segments
- [x] 1.5 Tests over the `benchmarks.json` coach texts (en/es) plus the scenarios in the spec

## 2. Dialog fallback (D3, D4)

- [x] 2.0 `ZoneProfileBar` draws an unknown segment with a neutral role and a "no zone given" title

- [x] 2.1 Fall back to the estimate when the dialog has no structured segments
- [x] 2.2 "Estimated from coach text" caption and estimate-aware aria label (en/es)
- [x] 2.3 Tests: structured wins, unzoned draws grey, distance hides, estimate renders with caption

## 3. Ship

- [x] 3.1 Changeset (`@kaiord/workout-spa-editor` patch)
- [x] 3.2 Archive after merge
