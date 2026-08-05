# Align Connections and Settings with the V2 screens

## Why

The structure of both surfaces already landed: Connections is one unified page
with bridges inside each source (#1081, #1089), Settings is a four-group split
shell with a live value on every row and an attention model behind it (#1053,
#1072, #1080). What did not land is the V2 _look_.

Two gaps, both measurable against the design bundle.

**1. Attention is painted amber; the V2 screens contain no amber at all.**
`Connections V2.dc.html` and `Settings V2.dc.html` resolve to exactly ten
colour tokens between them — `--c-ink`, `--c-text-2`, `--c-text-3`, `--c-card`,
`--c-elev`, `--c-page`, `--c-border`, `--c-border-soft`, `--c-line`,
`--c-ctrl-hover` — every one achromatic. Every attention state in both screens
is drawn the same way: an elevated surface, a plain border, and a
`triangle-alert` icon inked in `--text`. The connected state carries a
`--text-dim` dot, not a green one.

That is the handoff's rule, not a stylistic preference: `--brand-semantic-warning`
was retired **with no alias** precisely so its call sites would surface, and
README §2 names the replacement — `--bg-elevated` + `--border`, `--text` for
the headline, and a `triangle-alert` icon. Success and warning left the palette
because a state that needs the reader says so with an icon and a sentence
(principle 2/6). Today these two surfaces carry eleven amber and six emerald
call sites in raw Tailwind, which is the retired token reintroduced under
another name.

**2. Settings never moved off the raw-Tailwind dialect.** Issue #1121 measured
1115 `slate|gray` utilities against 431 role utilities across the SPA;
`SettingsPage` and `SettingsPanel` hold 98 of them across 22 files, while
`organisms/Connections` is already at zero. The group card is also on
`rounded-xl` (12px) — the _field_ radius — where the V2 screen draws cards at
16px.

## What Changes

- **Attention stops being a hue and becomes an icon.** A new
  `atoms/AttentionMark` (lucide `TriangleAlert`, inheriting `--text`) backs the
  banner in `ConnectionsBanner` and `SettingsAttention`, the row marker in
  `SettingsRowBody`, the summary tile in `ConnectionSummaryTile` and the status
  line in `ConnectionStatusLine`. The amber dot, the amber shell and the two
  amber rings are deleted. It is an atom rather than an `ICON_MAP` key on
  purpose: the map is one code line under its 80-line ESLint cap, so adding to
  it forces an unrelated split of a file three other waves are also editing,
  and five call sites otherwise repeat the same wrapper markup.
- **A card that needs attention is raised, not tinted.** `ConnectionSourceCard`
  and `DataTypeRoutingRow` swap `ring-1 ring-amber-500/40` for
  `bg-surface-elevated`, which is how both V2 screens separate a card that
  needs the reader from one that does not.
- **The connected state goes quiet.** `ConnectionBridgeLine`'s emerald tone and
  dot, `connection-card-copy`'s emerald/amber status dots and text, and
  `ConnectionSummaryTile`'s `good`/`warn` tones all become neutral roles.
- **`SettingsPage` and `SettingsPanel` move onto the role dialect** — 98
  `slate`/`gray` utilities across 22 files become `bg-surface*`, `text-ink-*`
  and `border-edge*`. This is #1121's share for this wave, and it takes the
  paired `dark:` variants out with it, since roles resolve in both themes.
- **The Settings card radius goes 12px → 16px**, on the group card, the first
  and last row corners that must match it, and the attention banner.
- **Type weights are capped at 600** in the files this change touches:
  `font-bold` and `font-extrabold` become `font-semibold`, per the handoff's
  "nothing above 600".
- **The two danger call sites move onto the danger role.**
  `ConnectionManagePanel` and `ConnectionBodyExport` swap
  `text-red-600 dark:text-red-400` for `text-[var(--danger-text)]`, matching
  the `--da-text` the V2 Disconnect button uses.
- **Copy is aligned to the V2 screens where the state behind it exists** —
  three strings in `en` and `es`. The Connections `intro` gains the clause
  about which source wins, which the page only earned when the source-of-truth
  picker shipped; `sourcesHint` states principle 5 the way the screen does; and
  the Settings privacy lead says plainly that local records are unencrypted and
  enumerates what actually leaves the browser.

## Deliberately NOT shipped

The V2 screens demonstrate several states with no state behind them. Three
prior waves reached the same conclusion and recorded it
(`archive/2026-07-29-add-connections-data-type-rows`,
`add-connections-change-source`, `add-connections-health-summary`); this change
does not overturn it, and re-verified each one:

- **Fallback in use** (`WHOOP` struck through → `Garmin` · "Backup in use since
  Jul 23"). `usedFallback` is computed as `i > 0` over the priority ranking in
  `resolve-effective-source.use-case.ts:62`. It is priority-mode only, is
  per-(type, day), and means "the head source had no record that day" rather
  than "this source broke". No transition timestamp exists anywhere in the
  product, so the date cannot be derived.
- **"Strain has no fallback"** as a rendered claim. `usedFallback` is undefined
  for `strain`, `vitals` and `heart-rate-series` — including Strain, the row
  the design uses to demonstrate the affordance.
- **"Token expired · Jul 23"**, **"stopped syncing 3 days ago"** and
  **"missing since Jul 23"**. No prober distinguishes an expired token from one
  never issued, and no onset date is recorded.
- **"Baseline reset — 3 days of new data"** and **"Tanita would be more
  accurate here"**. No state at all backs either.
- **"Notify me"** on the three unbuilt integrations. Nothing records interest.
- **"Custom instructions · 3 rules"**. Custom instructions are a free-text
  blob in one `AiTab` textarea, not a list, so a count would be invented.
- **`dataTypeHints` are left as they are.** The V2 wording predates the pass
  that derived all thirteen descriptions from what each schema actually
  carries, so adopting it would regress `daily-wellness` ("Readiness and body
  battery" for a schema holding steps, calories and intensity minutes),
  `strain`, `hrv` and `body-composition`.
- **The Preferences row grouping is untouched.** The V2 index shows Units,
  Language and Notifications as three rows; the repo already ships that shape.
  The screen's desktop rail groups them under one section, which is the shell's
  concern, not this change's.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application-port or adapter change; no dependency added; no schema or Dexie
  bump; no changeset (the SPA is excluded from the changeset-bot PUBLISHABLE
  set).
- **Shared code touched**: none. `atoms/AttentionMark` is a new directory, so
  no file outside the two surfaces is edited and no other wave can conflict
  with it. `ICON_MAP` is deliberately left alone — see above; the next wave
  that needs a key there has to split the file first.
- **Behaviour**: none. Every change is presentational or a string; no
  predicate, route, test id or data flow moves.
- **i18n**: no new keys and no removed keys — three existing values are
  reworded in `en` and `es`. `resource-parity.test.ts` continues to cover both.
- **e2e**: no test id changes. The attention marker keeps
  `data-testid="…-attention"` and its `sr-only` label.
- **Guards**: `check-theme-dialect.mjs` stays green and its dark-only rule gets
  22 fewer files to forgive; `check-mkt-boundary.mjs` is unaffected (no
  marketing token enters the SPA).
