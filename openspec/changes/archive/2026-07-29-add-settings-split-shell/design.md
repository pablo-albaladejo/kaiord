# Design — Settings split shell

## D1. The responsive switch is CSS, and that is a correctness property

`ChatWorkspace` is the precedent: `grid gap-4 md:grid-cols-[240px_1fr]`, one
tree, no measurement. The SPA has no `useMediaQuery` hook and this change does
not add one.

The reason is not only simplicity. `test-setup.ts` stubs `matchMedia` to
non-matching, so any JS-measured layout would render its narrow branch in every
unit test and its wide branch in every real desktop browser — two behaviours,
one of them never exercised by the suite. With CSS the tree is identical at
every width; only the box layout differs. Everything the tests assert about
structure therefore holds at both sizes.

The consequence is that **both roles' markup is always mounted**, which drives
D2.

## D2. The rail lists sections; the index list is not reused

A split needs a section list beside the pane. The first attempt reused
`SettingsGroupList` under a `variant`, rendering the index's rows as the rail
with their values suppressed. Review killed it, and the reason is worth keeping:
**the index's rows are not sections.**

```
/settings/preferences ← units, language, notifications   (3 rows)
/settings/ai          ← provider, customInstructions     (2 rows)
/settings/privacy     ← dataPrivacy, manageYourData      (2 rows)
the other four        ← 1 row each
```

A row-shaped rail therefore fails three ways at once:

1. **Several rows are "current" for one open section.** Marking by destination
   marked three rows at `/settings/preferences` — three `aria-current="page"`
   in one `<nav>`, and the whole group tinted. Matching on `location + search`
   does not fix it either: those three rows carry byte-identical `to` values.
2. **The rail repeats the panel's headings verbatim.** "Units", "Language" and
   "Notifications" are exactly the strings `PreferencesTab` and `LanguageRow`
   head their own groups with. Same screen, same words, twice.
3. **Row test ids exist twice** once the panel is mounted beside the list.

Entries are the **sections**, named with the `settings.tabs.*` labels the page
heading already uses (`Settings · Preferences` ⇄ rail "Preferences"), addressed
as `settings-section-<id>`. All three failures go away structurally rather than
by rule: one entry per section means one possible current entry; the section
names collide with no panel heading; `settings-row-*` now exists only on the
index, which is the only thing rendered at `/settings`.

`SettingsGroupList` and `SettingsRow` are consequently **untouched by this
change** — their diff against `main` is empty.

The e2e hazard that killed the value-carrying rail is worth recording, because
it constrains any future rail: `e2e/settings.spec.ts` and
`e2e/ai-generate-workout.spec.ts` add a provider named "My Claude" / "Test
Claude" at `/settings/ai`, then assert
`settingsPage.getByText(label, { exact: true })` — scoped to `settings-page`,
which contains the rail. A rail showing the `provider` row's value would render
that same string and resolve two nodes. `md:hidden` would not have helped:
Playwright's strict-mode check counts DOM matches before evaluating visibility.

The cost is that the rail drops `Connections`, `Manage your data` and
`Help & docs`, which are index rows without a settings section behind them
(`/athlete` and an external URL). Wave 1 turns Connections into a real section,
at which point it appears in the rail for free.

## D2a. Only the rendered surface reads its values

Because the rail is a separate component, it does not call
`useSettingsRowValues()` — so opening a section no longer mounts four
`useLiveQuery` **subscriptions** whose output nothing renders. That matters more
than it first looks: `useAiProvidersLive` performs a WebCrypto AES-GCM decrypt of
every stored API key on each run, and all four hooks are already mounted by the
panels themselves, so the variant approach had `/settings/ai` firing two
independent `getAll()` subscriptions on every provider write, each decrypting
every key, one of them to compute a string that was then discarded. It also
breached `CLAUDE.md`'s "one query per page" on four of the seven section routes.

Splitting the index into a values-fetching wrapper over a presentational list
would have worked too, but deleting the second consumer is smaller and leaves
`SettingsGroupList` exactly as it was.

## D3. `/settings` stays the index at every width

The design's split view always has a section selected; it never draws the
desktop root. Selecting a default section on desktop would need to know the
viewport, which D1 forbids. The alternatives were:

1. Always split; at `/settings` the pane shows a "pick a section" placeholder.
2. `/settings` is the index at every width; the split engages once a section is
   open.

(2) ships. Under (1) a desktop user at `/settings` would see a label-only rail
and an empty pane — strictly less than today, where the full list with its
values fills the width. Under (2) the desktop root is exactly today's page, the
rail appears when there is something to sit beside, and no placeholder copy has
to be invented and translated. Divergence from the design, deliberate.

## D4. One heading, above the split

The heading stays a single `<h1 data-route-heading>` above the grid, with its
existing text. The design puts "Settings" in the sidebar and gives each section
its own `h2` in the pane, which would either duplicate the route-heading
attribute or move it into a column that is display-none on mobile — both break
the `spa-routing` focus contract, which requires exactly one findable heading
per route. The section name stays in the `h1` (`Settings · AI`), so the
announced label still identifies the section.

## D5. Scroll reset writes `scrollTop`, and skips the first render

`window.scrollTo()` is unimplemented in jsdom and logs through the virtual
console — noise the repo's zero-warning policy does not accept. Writing
`scrollTop` on the scroller is silent there and correct in a browser.

`document.scrollingElement` is the standards-mode scroller but is **undefined**
under the jsdom in this repo (`"scrollingElement" in document` is false —
measured), so the hook falls back to `document.documentElement`. jsdom does
store `scrollTop` writes on that element even though it has no layout to
scroll, so the hook's test asserts on the real element and exercises the branch
that actually runs. An earlier version of the test stubbed
`document.scrollingElement` with a plain object, which meant all four cases
asserted on the stub and the `?? document.documentElement` fallback — the only
path jsdom takes — was never executed.

The first render is skipped deliberately. A deep link like
`/settings/privacy?section=data-management` is scrolled by
`useFocusOnSectionChange`; resetting on mount would race it. Only an actual
change of section resets. A `?section=` change alone does not touch the path
segment, so the two hooks never both fire for one transition.

## D6. Attention slots ship as a seam, not as a mock

`SettingsAttention` takes `SettingsAttentionModel | null` and returns `null` for
`null`. The shell passes `null` at both slots, so nothing renders and nothing is
claimed. No attention copy is added to the locale catalogs either: the strings
belong with the model that computes them, and inventing "1 connection needs
attention" now would put a sentence in the catalog that no code can produce.

Both branches are unit-tested, so the component is a real, exercised seam rather
than dead code — the same shape as the `status?: "attention"` prop that
`add-settings-row-values` added and left unset.

The variants follow the design: the banner carries the action ("Fix"), the chip
does not.

## D7. `spa-settings-shell` has no published capability spec yet

`add-settings-row-values` declared `spa-settings-shell` as a new capability and
was archived on 2026-07-28, but `openspec/specs/spa-settings-shell/spec.md` was
never created — the archive's delta is the only copy of those requirements. This
change therefore also files its requirements as `## ADDED Requirements` under
the same capability rather than `## MODIFIED`. The missing sync is pre-existing
and out of scope here; it should be closed with `/opsx:sync` when the umbrella
`unify-connections-page` program archives, folding both deltas into one
published spec.

## D8. The route parameter is renamed, the URL is not

`AppRoutes.tsx` goes from `/settings/:tab?` to `/settings/:section?`. Nothing
observable changes — wouter parameter names are internal — but the shell's
vocabulary is "section" throughout, and leaving the parameter called `tab` would
have meant reading `params.tab` inside a component whose whole job is sections.

The panel registry (`settings-tab-views.tsx`, `SettingsTab`, the
`settings.tabs.*` catalog keys) keeps its own name: those are the panel
organisms' vocabulary, they are shared with surfaces outside this shell, and
renaming them buys nothing this change needs.

**Known collision, flagged not fixed**: `?section=` already means a sub-section
_inside_ a panel (`useFocusOnSectionChange`). After this change "section" names
two things at different scopes. Renaming the query would touch the
`manageYourData` row, its unit tests and the focus hook — out of scope for a
layout change. `SettingsPage.tsx` documents the distinction at the type.

## D9. The rail is not pinned, because it cannot be

The design pins the sidebar (`position:sticky;top:20px`) while the pane scrolls.
Shipping that class here would have been dead CSS, which was established by
measurement rather than assumed.

`MainLayout` renders `<main class="… overflow-x-hidden …">`. Per CSS Overflow 3,
when one axis is `visible` and the other is not, `visible` computes to `auto` —
so `<main>` is a scroll container. Its height is content-driven, so it never
actually scrolls, and a `sticky` descendant resolves against a scrollport that
never moves. Measured in Chromium at 1440×800 on `/settings/ai`:

| `<main>` `overflow-x` | computed `overflow-y` | rail travel for a 139 px scroll        |
| --------------------- | --------------------- | -------------------------------------- |
| `hidden` (today)      | `auto`                | 139 px — tracks the scroll, never pins |
| `clip`                | `visible`             | 22 px — pins as intended               |

So the rail ships unpinned. It still persists beside the pane, which is the
substance of the split; only the pinning is missing.

**Follow-up, deliberately not taken here**: changing that one class to
`overflow-x-clip` fixes it. It was left out because `<main>` wraps every route,
the change cannot be verified by the unit suite (jsdom has no layout) or by e2e
on a branch (the SPA e2e job runs only on `main`), and it would silently
activate `CalendarWeekGridHeader`'s `sticky top-0`, which is inert today for the
same reason — a visible calendar change that belongs to whoever owns the app
shell, not to a Settings layout change.
