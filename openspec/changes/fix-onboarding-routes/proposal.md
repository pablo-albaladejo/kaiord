## Why

A brand-new user, on a fresh browser profile with the bridges installed, could
not reach "Send week" on kaiord.com without developer help. Four separate gaps
stood between a fresh profile and a working week, and each looked like a
dead end:

- The workout export route to Garmin could not be switched on anywhere. The
  seed migration only covered profiles that existed when it ran, and the
  Connections row that names where workouts are "also sent" was display-only.
  The Send week preflight and the push feedback said "no export route" with no
  path to one.
- Linking Train2Go did not open its import routes. The planned-session route
  was seeded only for profiles linked before the migration ran, so a profile
  linked afterwards synced nothing (`route-inactive`).
- The calendar hid "Connect to Train2Go" whenever the profile was not linked,
  which is exactly the state that needs it. The Connections card said
  "Connected" from the bridge session alone, whatever the active profile had
  linked.
- The first-run guide was static and keyed on the workout count, so a user
  whose first sync filled the week with coaching plans still read "Nothing here
  yet" above them.

## What Changes

- The "Also sent to" part of a data type's routing row switches each connected
  destination whose bridge announces the export capability on or off. Switching
  preserves the stored mode. "Nowhere" stays beside the switches until one is
  on. The unverified TrainingPeaks push is not offered. The no-export-route
  messages link to Connections.
- An explicit link of a source (the Train2Go link flow, or a Connections
  reconnect) seeds every import route that source feeds, as the registry
  derives it, narrowed to what the bridge's import writes (WHOOP: seven types,
  no scale routes). Training zones are seeded manual on a profile that already
  holds a threshold. Disconnect marks the routes it switches off, and the next
  link restores them; any other existing row, disabled or not, is left
  unchanged. A failed seed is logged and never fails the link.
- The calendar renders every available coaching source. A source the active
  profile has not linked offers "Connect to <Label>". A coaching card on
  Connections says when the source is not linked to the active profile, and
  offers the link while the source has a session, or asks for a sign-in first.
- The first-run guide ticks the steps that are already true and moves its
  emphasis to the first step still missing. It shows only while the profile
  holds no workout and no coaching plan in any week. It yields when the week holds
  coaching plans: without an AI key those plans get the missing-key banner, and
  the week is not called empty.

## Impact

- `packages/workout-spa-editor`: Connections routing row, Send week preflight,
  placement feedback, Train2Go connect action, connection actions, calendar nav
  row, calendar empty banners, first-run guide, and EN/ES locales.
- `IntegrationPolicy` gains an optional, non-indexed `disabledBy: "disconnect"`
  marker, so a reconnect can tell a route Disconnect switched off from one the
  user switched off. No index changes, so no Dexie version bump or migration.
  The table rides the cloud snapshot, so the marker travels with the row. An
  older build tolerates it: the restore path bulk-puts snapshot rows without
  validating them (`importTables` in `dexie-snapshot-port.ts`), the repository
  reads rows by cast rather than by schema, and `integrationPolicySchema` is a
  non-strict `z.object` that only ever parses the upsert's explicit input. The
  one gap is that an older build's upsert spreads the existing row and so keeps
  the marker: a route that an older tab or device switched on and off again
  after a Disconnect keeps it, and once that snapshot reaches this build, the
  next reconnect may switch the route back on. This mixed-version edge is
  accepted: the SPA is one deployed site, so it closes when the old tab
  reloads.
- A route that a Disconnect switched off before this change carries no marker,
  so it is indistinguishable from the user's own "off" and stays off on
  reconnect; the user switches it back on in Connections.
