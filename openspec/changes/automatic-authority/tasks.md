## 1. Proofs, red first

- [x] 1.1 `automatic-authority.test.ts`: the scale decides weight, the athlete's entry wins its day, the next Platform decides on disconnect, a disconnected or unnamed source is still read, a matrix choice overrides, a choice stops applying while the matrix is off
- [x] 1.2 `load-daily-wellness.test.ts`: the matrix choice while on, the automatic Authority once off
- [x] 1.3 `data-type-routing.test.ts`: rows name the Platform the rule picks; a kind with no Authority, or a choice to keep every source, counts
- [x] 1.4 `capabilities-context.test.tsx`: the matrix is off for a new athlete with its section and Tool unoffered, on for an athlete with a stored choice, not from another athlete's
- [x] 1.5 `DataTypeRoutingSection.test.tsx`: Connections asks nothing, links to the matrix only while on, names the automatic Authority once the matrix is off
- [x] 1.6 `AuthorityTab.test.tsx`: what decides each kind, pick, Automatic, a stalled choice, nothing to choose
- [x] 1.7 `use-zones-sync-orchestrator*.test.ts`: no dialog, the athlete's numbers stay, one offer, taking Train2Go's accepts every field, the same numbers are not offered twice
- [x] 1.8 `data-route-answer.test.ts`: `get_data_routes` reports the automatic Authority
- [x] 1.9 E2E `authority-automatic.spec.ts`: two Platforms never asked; the matrix on and off; English and Spanish, desktop and mobile
- [x] 1.10 `build-chat-tools.test.ts`, `set-authority-tool.test.ts`: with the matrix off the assistant still switches a source on or off with confirmation and `set_authority` is absent; on, both; the `set_authority` description matches the rule for every kind

## 2. Kaiord App

- [x] 2.1 `automatic-authority.ts`, `read-authority-choice.ts`; the resolver and the daily-wellness read
- [x] 2.2 The `authority-matrix` catalogue entry, the Settings section, its strings (English and Spanish)
- [x] 2.3 Connections rows without the ranking control, naming the automatic Authority, linking to the matrix while on
- [x] 2.4 The zones conflict dialog removed; one notice with "Use Train2Go's"; the auto-import switch worded for what it does
- [x] 2.5 Existing e2e specs of Connections and zones sync follow the new behaviour
