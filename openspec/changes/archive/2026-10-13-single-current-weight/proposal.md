> Completed: 2026-10-13

# Proposal: One current weight

## Why

Three weights had no single truth (audit finding P-03): `profile.bodyWeight`
(edited in the profile modal and the Athlete page), the weigh-ins in
`healthWeight` (Wellness, scales, imports), and the energy goal's
`startWeightKg`. Logging 71.9 kg in Wellness left the Athlete page saying
72.5 kg. The daily expenditure also computed BMR from `profile.bodyWeight`
even when a newer weigh-in existed, and gated an athlete who had weigh-ins
but no profile weight.

## What Changes

- One selector, `getCurrentWeightKg(profile, latestWeighIn)`: the latest
  weigh-in wins, however old; `profile.bodyWeight` is only the fallback for an
  athlete who has never weighed in.
- The Athlete page's Body section shows that value as "Current weight".
  Editing it records a weigh-in for today through `saveManualHealthMetric`;
  a re-edit on the same day updates that weigh-in instead of adding one. It
  no longer writes `profile.bodyWeight`.
- The weight field leaves the profile modal's Personal Data tab, so the
  Athlete page is the one place to edit it.
- Routed through the selector: the BMR gate and BMR of the day's predicted
  expenditure, the goal maintenance, the MET activity estimate, the goal's
  default start weight, the Athlete tagline and the profile snapshot sent to
  the Kaiord extensions.
- `energyTargets.startWeightKg` stays the goal's historic starting weight,
  labelled "Start weight".

## Impact

- No Dexie schema change: weigh-ins and profiles are existing synced tables.
- The Train2Go zones sync still compares and writes `profile.bodyWeight`; it
  reconciles the coach platform's profile field and is out of scope here.
