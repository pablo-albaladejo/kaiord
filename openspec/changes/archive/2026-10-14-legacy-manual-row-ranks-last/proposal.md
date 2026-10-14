> Completed: 2026-10-14

# Proposal: A legacy manual row ranks last

## Why

2026-10-14-manual-steps-own-row reads a legacy manual row (an imported row
that a steps save before that change re-stamped `manual`) as a full row, but
it still ranked it as `manual`. With no priority policy, manual ranks above
every imported row, so on a day that also has a row from WHOOP, Garmin or a
FIT import, the legacy row became the head and its stale calories won over
the fresher imported ones. Under a priority order that lists `manual`, it
took manual's slot the same way.

## What Changes

- A legacy manual row ranks after every other row of the day, in both
  "union" and "priority". It is a stale copy of imported data: a row its
  source still stamps is the fresher copy. Daily rows carry no common
  recency field, and ranking it as an imported row by source id would let
  it beat `whoop-bridge` only because `manual` sorts first.
- It stays the head when the day has no other full row, so a legacy-only
  day keeps its calories.
- A pure manual row still ranks above it, so genuine manual steps still
  replace its steps.

## Impact

- `mergeDailyWellnessDay` only; no schema or storage change.
