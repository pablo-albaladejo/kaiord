# Result summary — code-semantics-hardening

Implemented on branch `feat/code-semantics-hardening` (off `main` via the
`chore/propose-code-semantics-hardening` proposal). Five commits, one per
area wave.

## Before → after (audit grades)

| Area           | Before | After (intended) | What moved it                                                                                                                    |
| -------------- | ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| cli            | C+     | A−               | one typed exit-code mapper, environmental/service codes, FORMAT_REGISTRY single source                                           |
| garmin         | B      | A−               | named truncation limits + warnings, unknown-enum/REPS warnings, sport mapped to KRD vocab, conventions documented                |
| zwo            | B      | A−               | steady-state watts→%FTP warns, ASSUMED_FTP_WATTS/UNSUPPORTED_DURATION_FALLBACK_SECONDS named, corrupted-restore degrades to open |
| tcx            | B+     | A                | intensity narrowing announced, kaiord namespace headers, walker→decoder renames                                                  |
| fit            | A−     | A                | bpm offset + zone bounds + fitTimestampToIso single-sourced                                                                      |
| core           | A−/B   | A                | health version gate single-sourced, unit annotations, honest round-trip names, FNV/poolLength documented                         |
| garmin-connect | A−     | A                | retry policy named (retry-policy.ts), nowEpochSeconds, URL relocated                                                             |
| ai             | A−     | A                | dead eval fields removed, ZONE_TOLERANCE named                                                                                   |
| mcp            | A−     | A                | machine-readable error classification, recovery `skipped` parity                                                                 |
| spa-editor     | A−     | A−               | shared undo window, ItemId brand, mutation-action casts routed through the helper, auto-match doc fixed                          |

## New capabilities shipped

- `conversion-loss-honesty` — every lossy adapter path now emits a named
  `Lossy conversion:` warning with named assumed/fallback constants, and the
  `kaiord:` extension modules state their round-trip purpose.
- `failure-semantics` — the CLI classifies failures through one typed mapper
  with environmental/service categories; MCP returns machine-branchable
  `structuredContent.error` payloads.
- `adapter-contracts` delta — full 7-value intensity vocabulary handled
  explicitly (mapped or warned), GCN summaries speak KRD sport, REPS
  end-conditions degrade loudly.

## Verification at close

- `pnpm -r test`: all packages green (cli 270, core 314, fit 473, tcx 228,
  zwo 292, garmin 115, garmin-connect 95, ai 59, mcp 143, spa-editor 4558).
- Per-package type-checks and eslint clean; converter/mapper/barrel/PII/
  session-match guards pass.
- Changeset: `@kaiord/cli` minor (additive exit codes), `@kaiord/garmin`
  patch (sport mapping fix), patch for core/fit/tcx/zwo/garmin-connect/ai/mcp.

## Deferred to a follow-up

These two low-severity SPA items (both SUGGESTION in the audit) were scoped
out to keep the architectural work unrushed; the change tasks for them are
left unchecked:

- **Task 5.5** — the `MatchedSessionsReadModel` port + migration of
  `use-activity-match-state` / `use-matched-sessions-hydrate` off direct
  Dexie access, plus the `use-coaching-auto-sync` outcome log. This is a
  read-side clarity improvement requiring a new application-layer port and is
  best done as its own reviewed change.
- **Task 5.2 (read-pattern remainder)** — the eight step/block _mutation_
  actions now route through `extractStructuredWorkout`; the three remaining
  `structured_workout as Workout | undefined` casts are optional-chained
  _read_ projections (`history-actions`, `hydrate-ui-workout`,
  `use-back-handler`) whose consumers (`findById`, `preservedSelectionTarget`)
  type on `| undefined`. Converting them cleanly needs the helper widened to
  accept `KRD | null | undefined`; deferred with 5.5.
