## 1. Proofs, red first

- [x] 1.1 `automatic-authority.test.ts`: the scale decides weight, the athlete's entry wins its day, the next Platform decides on disconnect, a disconnected or unnamed source is still read, a matrix choice overrides, a choice stops applying while the matrix is off
- [x] 1.2 `load-daily-wellness.test.ts`: the matrix choice while on, the automatic Authority once off
- [x] 1.3 `data-type-routing.test.ts`: rows name the Platform the rule picks; a kind with no Authority, or a choice to keep every source, counts
- [x] 1.4 `capabilities-context.test.tsx`: the matrix is off for a new athlete with its section and Tool unoffered, on for an athlete with a stored choice, not from another athlete's
- [x] 1.5 `DataTypeRoutingSection.test.tsx`: Connections asks nothing, links to the matrix only while on, names the automatic Authority once the matrix is off
- [x] 1.6 `AuthorityTab.test.tsx`: what decides each kind, pick, Automatic, a stalled choice, nothing to choose
- [x] 1.7 `use-zones-sync-orchestrator*.test.ts`: no dialog, the athlete's numbers stay, one offer naming what differs, taking Train2Go's writes every field and says so, the same numbers are not offered twice, the offer stays open once the notice is gone, an agreeing sync forgets it
- [x] 1.10 `sync-zones-weight*.test.ts`, `current-weight.test.ts`, `load-day-energy-sources.test.ts`: Train2Go's weight is recorded as its own weigh-in and never offered; a day two sources weighed reads by the rule for the current weight and energy
- [x] 1.11 `sync-zones*.test.ts`: `commitConflictResolution` writes every conflict it is given, no reject path; a taken table is `train2go` and offers nothing on the next sync
- [x] 1.12 `zones-offer-memo.test.ts`, `ZonesOfferRow.test.tsx`: the offer is remembered per athlete on the device, survives a reload, closes on use or "Keep mine", and shows only numbers that still differ
- [x] 1.13 E2E `zones-sync.spec.ts`: the notice names the thresholds and says what changed; an own weigh-in today stays the current weight; the offer stays on the Athlete page after the notice and a reload
- [x] 1.8 `data-route-answer.test.ts`: `get_data_routes` reports the automatic Authority
- [x] 1.9 E2E `authority-automatic.spec.ts`: two Platforms never asked; the matrix on and off; English and Spanish, desktop and mobile
- [x] 1.10 `build-chat-tools.test.ts`, `set-authority-tool.test.ts`: with the matrix off the assistant still switches a source on or off with confirmation and `set_authority` is absent; on, both; the `set_authority` description matches the rule for every kind

## 2. Kaiord App

- [x] 2.1 `automatic-authority.ts`, `read-authority-choice.ts`; the resolver and the daily-wellness read
- [x] 2.2 The `authority-matrix` catalogue entry, the Settings section, its strings (English and Spanish)
- [x] 2.3 Connections rows without the ranking control, naming the automatic Authority, linking to the matrix while on
- [x] 2.4 The zones conflict dialog removed; one notice with "Use Train2Go's"; the auto-import switch worded for what it does
- [x] 2.6 Weight out of the zones notice: Train2Go's weight is a Train2Go weigh-in; the current weight reads a day by the rule
- [x] 2.7 The notice names zones and/or thresholds and confirms what changed (English and Spanish); `commitConflictResolution` takes the conflicts, without a reject path
- [x] 2.8 The offer stays open on the device (`zones-offer-memo.ts`, loaded lazily) and on the Athlete page ("Use Train2Go's" / "Keep mine")
- [x] 2.5 Existing e2e specs of Connections and zones sync follow the new behaviour

## 3. Review fixes (Authority)

- [x] 3.1 "Automatic" stores `automaticChoiceRow`: an older build's resolver reads it with the same Authority (tested against that resolver copied as a fixture)
- [x] 3.2 One function decides the Authority in force (`authorityInForce` / `loadAuthorityInForce`), used by the resolver, the daily-wellness reading and the assistant's answer; `readAuthorityChoice` asks the Capabilities' read API; the rule's pick is computed in the options, not in the copy
- [x] 3.3 Authority vocabulary: `useAuthorityChoiceEditor`, `AuthorityOptions`, `ChoiceButton`, `authorityMatrixLink`
