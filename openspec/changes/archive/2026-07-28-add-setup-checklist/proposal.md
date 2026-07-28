> Completed: 2026-07-28

## Why

First-run guidance in the SPA is a six-step centred modal (`OnboardingTutorial`)
whose steps are all `position: "center"`, point at nothing, and are gated on a
single "have you seen it" flag. It cannot know whether the user already created
a workout, already set an FTP, or already pushed a session to a watch — so it
replays the same tour to someone who is three weeks in, and stays silent for
someone who dismissed it on day one and never finished setting up.

The state that answers "is this user set up?" is already persisted and already
reactive: the profile's workout count, its sport thresholds, the discovered
bridges plus the v24 `connections` store, and the export ledger. Nothing reads
it for onboarding purposes.

## What Changes

- Add a **live setup checklist** — four items that tick themselves from real
  persisted state, rendered as a card on `/daily`, never as a modal:
  1. _Create your first workout_ — the active profile's `workouts` count.
  2. _Set your FTP and zones_ — a **threshold** (`ftp` / `lthr` /
     `thresholdPace`) on any sport, deliberately NOT the zone arrays.
  3. _Connect a source_ — a discovered bridge, or a `connected` record in the
     v24 `connections` store.
  4. _Push a session to your watch_ — a `workout` entry in the export ledger.
- Add `hooks/use-setup-checklist.ts`, which composes ONE aggregate
  `useLiveQuery` (`use-setup-checklist-facts.ts`) with the existing
  `useActiveProfileLive` and `useDiscoveredBridges` hooks, and a pure item
  model in `lib/setup-checklist.ts`.
- Add `components/molecules/SetupChecklist/` — the card, a progress rail and a
  row component. Done rows are struck-through inert text; the first not-done
  row is the next action, showing its hint and linking to the surface that
  completes it. A `✕` dismisses the card.
- Persist the dismissal in the existing per-profile `userPreferences` row as a
  new optional, unindexed `setupChecklistDismissed` boolean — **no Dexie
  version bump** — so it rides the cloud snapshot instead of being pinned to
  one device's `localStorage`.
- Add a `setup` i18n namespace in `en` and `es`.

Out of scope: the Help dialog, `HelpSection`, `OnboardingTutorial` (the modal
this eventually retires), the command palette, Settings, and any bridge
session-liveness polling.

## Capabilities

### New Capabilities

- `spa-setup-checklist`: a dismissible, self-ticking onboarding checklist
  derived from persisted state, with its dismissal stored per profile in the
  cloud-synced preferences row.

### Modified Capabilities

<!-- None. The onboarding tutorial keeps its current behaviour in this change. -->

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  port, adapter or dependency change.
- **New files**: `lib/setup-checklist.ts`,
  `hooks/use-setup-checklist{,-facts}.ts`, `hooks/use-setup-checklist.test.tsx`,
  `components/molecules/SetupChecklist/{SetupChecklist,SetupChecklistProgress,SetupChecklistRow}.tsx`,
  `components/molecules/SetupChecklist/SetupChecklist.test.tsx`,
  `i18n/locales/{en,es}/setup.json`.
- **Modified files**: `types/user-preferences.ts` and
  `application/set-user-preference-fields.ts` (one optional field each),
  `components/pages/Daily/Daily.tsx` (mounts the card).
- **Persistence**: additive optional field on an existing table. No schema
  version, no migration, no backfill; absence reads as "not dismissed".
- **i18n**: new `setup` namespace, `en` + `es` at key parity
  (`resource-parity.test.ts` stays green). Namespaces are glob-discovered, so
  no registry edit.
- **No** public-API impact and no changeset — the SPA is private and excluded
  from the changeset-bot PUBLISHABLE set.
