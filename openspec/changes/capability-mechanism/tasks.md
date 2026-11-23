## 1. Proofs, red first

- [x] 1.1 `resolve-capabilities.test.ts`: off for a new athlete, on when decided, adopted from existing data, an explicit off wins, routes by prefix, unowned surfaces offered
- [x] 1.2 `set-capability.test.ts`: one decision merged, the others kept, other preference writes keep them, missing profile refused
- [x] 1.3 `capabilities-context.test.tsx`: live over Dexie, adopted, on/off keeps the templates, per athlete, off outside the provider
- [x] 1.4 `capability-decisions-travel.test.ts`: the decision rides the Drive sync and the backup file
- [x] 1.5 Surfaces: `HeaderNavBar`, `BottomNav`, `capability-route-gate`, `routes`, `CapabilitiesTab`, `SettingsPage`, `build-chat-tools`, `chat-capabilities`, `offered-shortcut-handlers`, `CapabilityGate`, `WorkoutActions`, `AiSuccessActions`, `CreateInputPhase`, setup checklist
- [x] 1.6 `check-capability-surfaces.test.mjs`: each rule, the exemptions and the inert cases
- [x] 1.7 E2E `capabilities-templates.spec.ts`: new athlete, on and off without loss, existing athlete, English and Spanish, desktop and mobile

## 2. Kaiord App

- [x] 2.1 The catalogue, `resolveCapabilities`, `capabilityHome`
- [x] 2.2 `userPreferences.capabilities` and `setCapability`
- [x] 2.3 `CapabilitiesProvider`, `useCapabilities`, `CapabilityGate`, `CapabilityRouteGate`
- [x] 2.4 Navigation, settings, commands, shortcuts, the assistant's Tools and list, the setup checklist and every link to Templates read it
- [x] 2.5 Settings, Capabilities, English and Spanish

## 3. Repo

- [x] 3.1 `check-capability-surfaces.mjs` in `pnpm lint`, listed in CLAUDE.md, AGENTS.md and `scripts/README.md`
- [x] 3.2 Existing Library e2e specs turn Templates on first
- [x] 3.3 GLOSSARY.md names the Capability in both languages

## 4. Review fixes

- [x] 4.1 Decisions in their own `capabilityDecisions` store (Dexie v40 moves the old map), synced, backed up, cascaded and re-keyed; preferences writes keep unknown fields; the older-writer sequence tested for Templates and the matrix
- [x] 4.2 The route gate matches as the router does (case, trailing slash, encoding, query, hash), back and forward included
- [x] 4.3 The provider writes through `usePersistence()`, carries no data, and `useCapabilities()` throws outside it
- [x] 4.4 `CapabilityRouteGate` lives in `components/atoms/CapabilityGate/`
- [x] 4.5 Every id typed (`CapabilityId`, `InScreenSurfaceId`); in-screen ownership in the catalogue's `owns.inScreen`; empty `commands`/`shortcuts` kinds removed
- [x] 4.6 Guard: value imports only, owned settings paths, decision reads, `MODULES` beside the guard, rules split under 100 lines, `guard-failure.mjs` output
