## Context

Four independent pieces of persisted state answer "is this user set up?", and
each already has a home in the SPA:

- `workouts`, profile-scoped since Dexie v13 (`[profileId+date]`, `profileId`).
- `profiles[].sportZones.<sport>.thresholds`, read reactively by
  `useActiveProfileLive`.
- Bridge presence: the in-memory `bridgeDiscovery` singleton (exposed by
  `useDiscoveredBridges`, bootstrapped by `use-store-hydration`) plus the v24
  `connections` store.
- `exportLedger`, whose Dexie repository already exposes
  `countByDataType(dataType)` against the v18 `dataType` index.

`userPreferences` is a per-profile row keyed on `profileId`, lazily created,
and already carries four optional unindexed fields added without a schema bump
(`aiBannerExpanded`, `units`, `labDashboardParams`, `locale`).

## Goals / Non-Goals

**Goals:**

- Items tick from state the user actually produced, never from a "seen it" flag.
- One Dexie query for the checklist, per the repo's one-query-per-page rule.
- A dismissal that survives a reload AND follows the profile across devices.
- Respect the SPA caps: ≤80 lines/file, ≤60 lines/React component function.

**Non-Goals:**

- Retiring `OnboardingTutorial` (a later wave in the Help redesign).
- Any bridge polling, session-liveness check, or connection repair.
- Making the item set configurable, or adding a fifth item.

## Decisions

### D1 — Item 2 reads a THRESHOLD, never the zone arrays

Every profile is seeded with `DEFAULT_POWER_ZONES` (7 entries) and
`DEFAULT_HEART_RATE_ZONES` (5 entries) from `types/profile-defaults.ts`. A
`zones.length > 0` predicate therefore ticks "Set your FTP and zones" for a
brand-new profile on day zero, which is exactly the false-positive that makes a
self-ticking checklist worse than no checklist. `hasAnyThreshold` reads
`thresholds.ftp`, `thresholds.lthr` and `thresholds.thresholdPace` across every
sport in `sportZones`, and any one of them being non-null ticks the item.

Three thresholds rather than `ftp` alone because `SPORT_ZONE_CAPABILITIES`
gives power to cycling and running only: a swimmer's meaningful setup act is a
threshold pace, and an FTP-only predicate would leave them permanently
un-ticked. The item's copy still names FTP because it is the term the majority
of the audience searches for.

The corresponding regression test seeds a profile carrying the full default
zone arrays and asserts the item is NOT done.

### D2 — Discovery presence is enough; no polling is started

Item 3 could in principle assert a _live_ bridge session. It deliberately does
not. `useBridgeConnectionsBootstrap` (Wave 0b's polling store) is intentionally
unmounted in production until the Connections UI is wired, and mounting it from
an onboarding card would start background polling as a side effect of visiting
`/daily` — a scope and cost the checklist has no business incurring.

The question the item asks is "has this user connected anything at all", and
both a discovered bridge (`useDiscoveredBridges`, backed by a discovery
singleton the app already bootstraps) and a `connected` record in the v24
`connections` store answer it. A source that is connected but currently
unreachable still means the setup step is done; repairing it is the Connections
UI's job, not the checklist's.

### D3 — One aggregate `useLiveQuery`, not four

`use-setup-checklist-facts.ts` reads the workout count, the connected-provider
count, the export-ledger count and the dismissal preference inside a single
`useLiveQuery` callback. Dexie tracks every table touched inside one callback,
so a write to any of the four re-fires the aggregate — four separate hooks would
buy nothing but four subscriptions. `useActiveProfileLive` stays a separate
call because it is a pre-existing shared hook whose result is already cached
across the page, and `useDiscoveredBridges` is a `useSyncExternalStore` over an
in-memory singleton, not a Dexie read at all.

### D4 — Unresolved state reads as dismissed

The aggregate's `defaultResult` is `{ …zeroes, dismissed: true }`, and a null
`profileId` resolves to the same shape. A card that renders on the first frame
and vanishes once a stored dismissal resolves is worse than one that appears a
frame late, and this also gives the "no active profile yet" gate for free
without a second flag in the hook's return type.

### D5 — The dismissal is an optional field on `userPreferences`

`localStorage` would pin the dismissal to one browser; `userPreferences` is
profile-keyed and rides the cloud snapshot, so dismissing on the phone also
dismisses on the laptop. `setupChecklistDismissed` is optional and unindexed,
which is the same shape as `labDashboardParams` and `locale` — Dexie only needs
a version bump for index changes, so this is purely additive with no migration
and no backfill. Absence reads as "not dismissed", which is the correct default
for every pre-existing row.

`complete` hides the card independently of the flag, so a user who finishes all
four items never has to dismiss anything and no write happens on their behalf.

### D6 — The push signal is the export ledger, which is device-scoped

`exportLedger` carries no `profileId`; `countByDataType("workout")` is therefore
device-global. This is accepted: the item asks whether the user has ever pushed
a session, and knowing how to push is a property of the person, not of the
profile row. The alternative — scanning the profile's workouts for a non-null
`garminPushId` — is profile-scoped but needs a non-indexed filter over every
workout the profile owns, and would miss pushes recorded only in the ledger.
The ledger read is an index count. A second profile on the same device seeing
item 4 pre-ticked is a benign false positive on a dismissible hint.

### D7 — Rows link, the card does not navigate

The next action is a `wouter` `<Link>` to the href the item model composed.
Only item 1 carries `?from=daily` via `withOrigin`, matching `PlannedEmpty` on
the same page, because the editor is the only target that parses `BackOrigin`;
`/athlete` ignores the query and `/calendar` redirects to the current week and
drops it, so adding it there would be decorative. Done rows render as plain
text, not disabled links: there is nothing to do there, and a struck-through
link invites a click that leads nowhere useful. Items 2 and 3 both target
`/athlete`, which is where `ThresholdCard` and `AthleteConnections` both live
today.

### D8 — Module layout is cap-driven

The 80-line file cap splits the feature into six files: the pure model
(`lib/setup-checklist.ts` — item ids, i18n keys, hrefs, `hasAnyThreshold`), the
aggregate query, the composing hook, and three components (card, progress rail,
row). The pure model in `lib/` is what lets the card test build realistic item
arrays without touching Dexie.

## Risks / Trade-offs

- **Device-scoped push signal** → see D6. Bounded to a false "done" on an
  onboarding hint; never blocks or hides anything.
- **A user with real zones but no threshold sees item 2 un-ticked** → Someone
  who hand-edited zone boundaries without recording the threshold they derive
  from is asked to record it. That is the intended nudge, not a bug: the rest
  of the app scales from the threshold.
- **The card competes with `OnboardingTutorial`** → Both can appear for a
  first-run user until the tutorial is retired in a later wave. The checklist
  is non-blocking, so the overlap is visual clutter, not a trap.
- **Mounted only on `/daily`** → A user who lives on `/calendar` never sees it.
  `/daily` is the app's "what now" surface and the natural home for a "what's
  left" card; a second mount point can be added without touching the hook.

## Migration Plan

None. The new preference field is optional and unindexed, so existing rows stay
valid and the Dexie schema version is unchanged. Rollback is deleting the new
files, unmounting the card from `Daily.tsx`, and dropping the field from
`userPreferences` — stale values in existing rows are ignored by the schema's
`.optional()` and by the cloud snapshot.

## Open Questions

- None blocking. Whether the checklist should also surface on `/calendar`, and
  whether it should replace `OnboardingTutorial` outright, are decisions for
  the Help-redesign wave that owns the tutorial.
