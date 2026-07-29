## Context

The header is the one component on every route, so every decision here is
paid for on every screen and every e2e spec. Two constraints shaped the work
more than the reference design did: the nav registry is the single source of
truth for both header and bottom nav (with a parity test), and the SPA e2e
job runs only on `main`, so a broken selector would not surface on the PR.

## D1 — The reachability invariant had to get stronger, not weaker

`NavSurfaces.header` was documented as "the only guarantee of desktop
reachability — every destination MUST set it", and the parity test asserted
exactly that. Moving Settings into the avatar menu makes the assertion false,
and the cheap fix — delete the test — would discard the check that caught
Nutrition being unreachable on desktop.

Instead the surfaces are enumerated (`bar`, `overflow`, `accountMenu`, plus
`parentId` for nesting) and the test asserts that each destination has
**exactly one**. That is strictly stronger than the old rule: it still fails
for a destination nobody can reach, and it now also fails for one that would
render in two chromes at once. Mutating `chat` to have no surface fails it;
so does making Labs a bar sibling again (via the sibling assertions).

The raw table moved to `nav-rows.ts` because the SPA's `max-lines` is 80 and
a seven-field table plus the mapping does not fit in one file.

## D2 — "More" exists below `md`, against the design

The reference design's mobile header is logo + page title + amber icon +
avatar, and the mobile bottom bar is Daily · Calendar · Library · Nutrition ·
Athlete. Between them, Trends, Labs and Chat appear nowhere. The bottom bar
is capped at five by its fixed layout, so they cannot go there.

Chat has a floating `ChatFab`, so it survives. Trends and Labs would not.
The overflow menu therefore stays visible below `md` as an icon-only trigger.
Inside it, the Nutrition row is `hidden md:flex`, because below `md` the
bottom nav already carries Nutrition and a menu offering it again is the
duplication the header's `md:` hiding rules exist to prevent.

The design's mobile page title is also dropped: every routed page renders its
own `[data-route-heading]` immediately below the header, so the title would
be the same words twice, six pixels apart.

## D3 — The theme toggle is a menu item, not a button in menu content

Radix's menu content calls `event.preventDefault()` on Tab
(`@radix-ui/react-menu`), so a plain `<button>` nested inside it is reachable
by mouse and by nothing else. The toggle is therefore a
`DropdownMenu.Item asChild`, which requires `ThemeToggle` to forward its ref
and props — Radix's `Slot` merges `className` and composes handlers, and the
component's own `onClick` must compose rather than replace the slot's, since
the slot's click is what dispatches the item-select event.

`onSelect` is prevented so the menu does not close: comparing light and dark
means pressing this twice.

The consequence is that its ARIA role changes from `button` to `menuitem`,
which six e2e assertions keyed off. They now use `data-testid="theme-toggle"`
behind an `openAccountMenu` helper. One of them — "should have visible focus
indicators" — was retargeted to the account trigger instead: the toggle now
lives inside a Radix `FocusScope` that owns focus while the menu is open, so
focusing it directly no longer tests the page's focus styles.

## D4 — One derivation, two wordings

Wave S3 built `buildAttention(sources, t)` inside
`components/pages/SettingsPage/`. The header needs the same fact, and a
template importing a page's internals to get it would be the shape that
produced two disagreeing predicates last time.

The split is by what actually differs. `application/connections/
source-attention.ts` returns `{ count, cause }` with `cause` a typed union —
no strings, no `Translate`. `attention-cause-copy.ts` maps a cause to the one
sentence, read from `common.sourceHealth.*` by both surfaces. Only the title
differs per surface, because only the title genuinely differs: Settings sits
beside its Connections row and says "connections need attention"; the header
sits above the whole app and says "sources down".

`use-settings-attention.test.tsx` was not touched and still passes, which is
the evidence that the move preserved behaviour.

## D5 — No cold-load gate, because the cold state cannot reach the pill

Before the first refresh pass, `createSnapshotReader` answers every known
bridge with `undiscoveredEntry` — `discovered: false`. `isBridgeConnected`
then answers false, and `bridgeSourceStatus` returns `available` for an
unconnected source before it looks at anything else. `needsAttention` rejects
`available`. So the pill is silent on a cold load **by construction**, and a
"has discovery settled?" gate on top of it would guard a state that cannot
occur — the failure this programme keeps producing, inverted.

`use-connections-value.ts` does need such a gate, and has one
(`useBridgeConnectionsRefreshed`), because it renders a COUNT: "0 of 5
detected" is a wrong sentence, where "no pill" is a correct absence. The
difference is whether the surface says something when it knows nothing.

This is pinned by `source-attention.integration.test.ts`, which drives the
real registry, the real `SESSION_PROBES` map and the real `undiscoveredEntry`
rather than card fixtures, so it fails if any of those three change shape.

## D6 — Testids kept, and the ones that could not be

`status-header-<id>-button` survives for every bar entry, so
`calendar-navigation.spec.ts` is untouched. Two could not survive:

- `status-header-labs-button` — Labs is no longer a bar entry. It is
  `nav-menu-item-labs` inside whichever menu currently owns it, and
  `e2e/helpers/nav.ts` picks the right one by viewport.
- `status-header-settings-button` — Settings is `account-menu-item-settings`.

`status-header-profile-button` is gone with `ProfileEntryButton`; no e2e spec
referenced it.

A subtler break surfaced only by running the suite locally: the legacy
`openHeaderAction` hamburger branch used `page.getByLabel("Menu")`, which is
a case-insensitive **substring** match, so the new avatar trigger's "Account
menu (…)" label landed in that branch and the helper opened the account menu
and then hunted for a `button` among `menuitem`s. It is now `exact`.
