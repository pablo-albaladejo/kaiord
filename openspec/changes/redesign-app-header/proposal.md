## Why

The app shell's navigation is ten flat destinations over two wrapping rows.
Settings, Help and the theme toggle sit in that second row as peers of
Calendar, though none of them is a place you go to train. Trends and Labs are
siblings in the bar although they are the same `/health` route, parent and
child. The Athlete page — FTP, zones, thresholds — is reachable only by
clicking a chip showing the profile's name, so the destination is named after
whoever is signed in rather than after what is behind it.

And when a source stops syncing, the shell says nothing. The only surfaces
that report it are the Settings banner and the Connections cards, three taps
away, so a user whose WHOOP session expired finds out when they notice the
data is missing. Meanwhile the header carries two chips — "Garmin: Connected",
"Train2Go: Synced" — that render whenever their extension is installed,
including when everything is fine. Chrome that is present in the healthy case
is not a signal, and neither chip covers WHOOP, TrainingPeaks or Tanita.

## What Changes

- **Two nav rows become one.** Daily · Calendar · Library · Nutrition ·
  Trends ▾ · Chat · Athlete, then the account cluster. Athlete is a named
  destination rather than an account chip.
- **Labs folds under Trends.** The Trends slot becomes a dropdown listing
  Trends and Labs, so the two `/health` routes read as parent and child.
- **Settings, Connections, docs and the theme toggle move into an avatar
  menu.** All four are account-level; none is a training destination.
- **A "More" menu carries the overflow below `lg`.** Nutrition, Trends, Labs
  and Chat leave the bar there. This menu also exists below `md`, which the
  reference design's mobile header does not show — without it Trends and Labs
  would be unreachable on a phone, since the bottom nav is full at five tabs.
  The Nutrition row inside it is hidden below `md`, where the bottom nav
  already carries it.
- **The registry gains the new surfaces.** `nav-destinations.ts` grows
  `bar` / `overflow` / `accountMenu` alongside `bottomNav`, plus `parentId`
  for nesting, and the raw table moves to `nav-rows.ts`. The parity test
  stops asserting "every destination is in the header" — which is no longer
  true of Settings — and asserts the stronger property instead: every
  destination has **exactly one** desktop surface. A destination with none is
  unreachable; a destination with two appears twice on one screen.
- **An amber pill reports sources that are down, and nothing otherwise.**
  It names the count, states the consequence, and leads to
  `/settings/connections`. The avatar menu's Connections row carries a dot on
  the same condition. When every source is healthy, neither exists — no
  badge, no dot, no grey "all good" chip.
- **The per-bridge chips are retired.** `StatusIndicators`,
  `ProfileEntryButton` and `StatusEntryButtons` are deleted.
- **One attention derivation, two wordings.** `buildAttention` moves out of
  `components/pages/SettingsPage/` into
  `application/connections/source-attention.ts` and stops returning
  translated strings: it returns a count and a typed cause. Settings words it
  "N connections need attention"; the header words it "N sources down"; the
  consequence sentence is one string in `common`, read by both. There is no
  second predicate, because the last time two of these existed independently
  they disagreed and a banner contradicted the cards beneath it.

## What is deliberately NOT built

The reference design's pill dropdown reads "WHOOP stopped syncing 3 days ago
/ Sleep and HRV fell back to Garmin. Strain has no other source." None of
that ships:

- **"stopped syncing 3 days ago"** — no transition timestamp exists anywhere.
  `lastCheckedAt` is when the SPA last probed and resets on reload;
  `lastSyncAt` is when data last arrived, which is what the pill says instead.
- **"fell back to Garmin"** — `union` is the default multi-source mode and has
  no ranked winner, so for most data types there is no fallback to name.
- **A "Reconnect" CTA** — reconnecting is per-source and lives on the card. A
  header button would have to choose a source on the user's behalf.
- **"Local account · encrypted"** in the avatar menu — local Dexie records are
  not encrypted at rest; only sync snapshots are, before upload. The menu says
  "Local account" and stops there.
- **A mobile header page title** — every routed page already renders its own
  `[data-route-heading]` directly beneath the header.

`tanita-bridge` can never appear in the count: it has no session prober by
design, so its card reads "installed" and never "attention". WHOOP's line
says "signed out", never "expired" — the bridge cannot tell an expired token
from one that was never issued.

## Capabilities

### Modified Capabilities

- `spa-routing`: the shell's navigation surfaces are enumerated and each
  destination is required to have exactly one of them; the header gains a
  source-health signal that is silent while healthy. Two existing
  requirements that name deleted components or a modal Settings dialog are
  corrected.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application-port or adapter change; no dependency added; no Dexie schema
  change.
- **Moved, not duplicated**: `connection-attention.ts` →
  `application/connections/source-attention.ts` (derivation) +
  `attention-cause-copy.ts` (the one `Translate` mapping) +
  `hooks/connections/use-connection-attention.ts` (the shared hook).
  `use-settings-attention.ts` now renders that model instead of computing
  one. Its existing test is unchanged and still passes, which is the evidence
  the move is faithful.
- **`ThemeToggle` forwards its ref and props** so a Radix `asChild` slot can
  adopt it. Radix menus `preventDefault()` on Tab, so a plain button nested
  in menu content would be keyboard-unreachable; it is a `menuitem` whose
  `onSelect` is prevented, so the menu stays open across a toggle. It also
  gains `data-testid="theme-toggle"`, which is how e2e reaches it now that
  its role is `menuitem`.
- **i18n**: three shared consequence strings move from `settings.attention.*`
  to `common.sourceHealth.*` (same text, both locales); `nav` gains eight
  keys in both locales. No string is reworded.
- **e2e**: `status-header-labs-button` and `status-header-settings-button` no
  longer exist as bar buttons. `e2e/helpers/nav.ts` reaches a destination
  through whichever chrome currently owns it, `openHeaderAction` falls
  through to the avatar menu, and `openAccountMenu` fronts the theme toggle.
  `getByLabel("Menu")` in the legacy hamburger branch is now `exact` — it is
  a case-insensitive substring match, so it was matching the new avatar
  trigger's "Account menu (…)" label and opening the wrong menu.
- **No** changeset (the SPA is private and excluded from the changeset-bot
  PUBLISHABLE set).
