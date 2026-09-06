# Design · Rebrand V2 foundation

## D1 · The `@font-face` block is not a token, and it stays

The handoff says to copy `brand-tokens.css` over the repo's file. The bundle's
file carries no `@font-face` rule, and the repo's does: the landing page has no
CSS of its own that declares Inter, so a literal byte-for-byte copy would drop
the self-hosted font on `kaiord.com` and fall the page back to `system-ui`.

The rule is kept verbatim at the top of the file, above layer 1, along with the
comment recording that the docs and editor surfaces re-declare it with their own
base path and that all other fields must stay byte-equal across the three. Every
**token** in the file is byte-identical to the bundle.

## D2 · Node reads CSS, so Node has to resolve `var()` and oklch

Three Node-side consumers read `styles/brand-tokens.css` directly:
`<meta name="theme-color">` in the VitePress head, the OG card generators, and
the bridge-popup parity guard. Until now every themed token was a hex literal,
so "read the declaration text" was enough.

It is not enough any more. `.dark { --bg-page: var(--n-1200); }` and
`:root { --n-1200: oklch(0.160 0 0); }`: a reader that returns the raw
declaration hands `var(--n-1200)` to an HTML meta tag and to `sharp`.

`scripts/brand-tokens.mjs` becomes the single resolver. It reads the first flat
`.dark { … }` block (falling back to the file for theme-invariant tokens),
follows `var(--x)` references until it reaches a literal, and converts
`oklch(L C H)` to `#rrggbb` through Oklab → linear sRGB → gamma, clamping to
gamut. `packages/docs/.vitepress/brand-tokens.mjs` re-exports it so the existing
VitePress import path and its tests keep working.

Resolution stops at 8 hops. A cycle is a bug in the token file, and the loop
must not be the thing that reports it as a hang.

## D3 · The alias layer is deleted in the same change that migrates the call sites

The handoff ships layer 3 (`--brand-bg-deep`, `--brand-text-primary`, …) so the
migration can be staged. Staging it across changes would mean merging a `main`
where two names for one colour are both live, and the second name is the one the
lint rule cannot see. All 263 call sites move in this change, and the alias block
is deleted from both role blocks before it is merged.

Four names in use had no alias in the bundle — `--brand-bg-primary`,
`--brand-bg-surface`, `--brand-border-soft`, `--brand-code-bg` /
`--brand-code-block-bg`, `--brand-semantic-danger-soft`. They are not added back:
each maps onto an existing role.

| Retired name                           | Role                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `--brand-bg-primary`                   | `--bg-page`                                                                   |
| `--brand-bg-deep`                      | `--bg-page`                                                                   |
| `--brand-bg-surface`                   | `--bg-surface`                                                                |
| `--brand-bg-elevated`                  | `--bg-elevated`                                                               |
| `--brand-border`                       | `--border`                                                                    |
| `--brand-border-soft`                  | `--border-subtle`                                                             |
| `--brand-text-primary`                 | `--text`                                                                      |
| `--brand-text-secondary`               | `--text-secondary`                                                            |
| `--brand-text-muted`                   | `--text-dim`                                                                  |
| `--brand-semantic-danger`              | `--danger`                                                                    |
| `--brand-semantic-danger-soft`         | `--danger-bg`                                                                 |
| `--brand-code-bg`                      | `--bg-elevated`                                                               |
| `--brand-code-block-bg`                | `--bg-sunken`                                                                 |
| `--brand-font-sans`                    | `--font-sans`                                                                 |
| `--brand-font-mono`                    | `--font-sans` + `tabular-nums slashed-zero`                                   |
| `--brand-accent-blue{,-hover,-active}` | `--control{,-hover,-active}`, ink `--control-ink`; `--mkt-cta` on the landing |
| `--brand-accent-blue-soft`             | `--bg-elevated`; `--mkt-brand` tint on the landing                            |
| `--brand-accent-purple`                | `--control`; `--mkt-brand` on the landing                                     |
| `--brand-semantic-tip{,-soft}`         | `--bg-elevated` + `--text-secondary`                                          |
| `--brand-semantic-warning{,-soft}`     | `--bg-elevated` + `--border` + `--text` + a `triangle-alert` icon             |

## D4 · `--font-sans` is declared once, unlayered, and Tailwind loses

Both Tailwind surfaces mapped the font through their own `@theme`:
`@theme { --font-sans: var(--brand-font-sans); }`. The role token is now named
`--font-sans` itself, so that line would compile to a self-reference
(`--font-sans: var(--font-sans)`), which is invalid at computed-value time and
takes the whole `font-sans` utility with it.

The mapping is deleted instead. Tailwind v4 emits its theme variables inside
`@layer theme`; `styles/brand-tokens.css` declares `--font-sans` in an unlayered
`:root`, and unlayered declarations beat layered ones regardless of order. The
`font-sans` utility and the preflight `--default-font-family` both resolve to
Inter with no mapping at all.

## D5 · The SPA's `primary-*` ramp is repointed, not removed

`--color-primary-50…950` in the editor's `index.css` is the retired accent blue
smoothed into eleven steps, and 179 component call sites use it —
`bg-primary-600 text-white` is the primary-button idiom, and `Button.test.tsx`
and `ConfirmationModal.test.tsx` assert those exact class names.

Removing the ramp is the screen work. What this change does is take the blue out
of it: each step is repointed onto the chroma-0 neutral ramp, chosen so every
existing pairing keeps or improves its contrast.

| Utility step  | Was          | Becomes                            | Why                                                                                             |
| ------------- | ------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| 50…500        | sky 50…500   | `--n-50`…`--n-500`                 | same lightness band, so light-tint surfaces are unchanged                                       |
| 600, 700      | sky 600, 700 | `--n-900`, `--n-1000`              | `bg-primary-600 text-white` needs an ink button, not a mid grey — 16:1 instead of the old 4.6:1 |
| 800, 900, 950 | sky 800…950  | `--n-1100`, `--n-1200`, `--n-1200` | `bg-primary-900` is a dark surface in `check-theme-dialect.mjs`'s own token list                |

`--color-secondary-*` — the purple — is deleted outright: eleven steps, zero
component call sites.

The one behaviour this does not fix is that a primary button in dark mode stays
dark-on-dark rather than flipping to `--control`'s white. That flip needs
`text-white` → `text-control-ink` at every call site, which is the screen waves'
job, not a token change's.

## D6 · The marks are React components, hand-written, with no new dependency

`mark.svg` and `mark-core-live.svg` must be inlined: an SVG behind `<img src>`
is an isolated document and inherits neither `currentColor` nor `--core-live`,
so both would render black. The handoff assumes `vite-plugin-svgr` and a
`?react` import; the repo has no such plugin, and a foundation change is the
wrong place to add a build dependency.

`atoms/BrandMark/` carries the geometry by hand — the same coordinates, the same
`stroke-width`s, `currentColor` throughout, and `fill="var(--core-live,
currentColor)"` on the `r=4` core. One component, one `core` prop, so the
marketing mark and the live-core mark are not two copies of thirteen path
elements.

`--core-live` is **not wired to a zone in this change.** No derivation of "the
dominant zone of the week" exists yet — the calendar reads per-session zone
data, and rolling it up to a week is exactly what the Calendar wave builds. The
SVG's `var(--core-live, currentColor)` fallback renders ink until then, with no
JS, which is also the correct rendering for an empty week.

## D7 · Derived rasters are generated, never hand-drawn

`assets/` holds six PNGs derived from the SVG masters, and nothing in the repo
regenerated them — `assets/AGENTS.md` says "regenerate PNG variants from
`logo.svg` / `favicon.svg` whenever the master changes" and offers no way to.
`sharp` is already a root devDependency and
`scripts/build-extension-icons.mjs` is the precedent for rasterising an SVG
master, so `scripts/build-brand-images.mjs` does the same for the brand set and
mirrors the results into the three `public/` directories that hold hand-copied
duplicates.

The OG card art moves to `scripts/brand-og-card.mjs`, which the landing, docs
and editor generators all call with their own subtitle. It was already the same
SVG in two files, and the old copy drew the pre-rebrand hub inline.

`apple-touch-icon.png` renders from `mark-app-icon.svg`, not from the favicon:
on a home screen the user is already inside the login, so the mark is ink.

## D8 · The magenta boundary is a lint rule, because a file cannot hold it

`--mkt-brand` and `--mkt-cta` live in the same role blocks as every other token,
because a theme-dependent value has to sit inside the two blocks that exist —
that is the same invariant that keeps `.dark` flat. So nothing in the file
stops a product component from referencing them.

`scripts/check-mkt-boundary.mjs` fails `pnpm lint` when `--mkt-` appears outside
`packages/landing/**`, the OG card builder, and the token file itself. It follows
`check-theme-dialect.mjs`: a regex walk, an `ALLOWLIST` that ships empty and is
covered by the shrink-only guard, and a remediation line naming the role to use
instead.

## D9 · The bridge popups get literals, not a stylesheet

Chrome extensions ship flat unbundled files and cannot `@import` the repo's CSS,
so `packages/_shared/bridge-core/popup.css` re-declares the dark palette as
`--kd-*` literals and a parity guard pins each one to its source.

The guard's comparison changes shape: it compared hex to hex, and the `.dark`
block now holds `var()` chains into oklch. It resolves through
`scripts/brand-tokens.mjs` and compares resolved sRGB hex against the popup's
literal, so the popup master keeps shipping hex — Chrome renders oklch, but hex
keeps the file readable as a palette and keeps the guard's failure message
legible.

`--kd-accent-blue*` becomes `--kd-control*`, `--kd-semantic-tip` and
`--kd-semantic-warning` leave with the tokens they mirrored, and the header dot's
per-bridge `--accent` override stays: it is set in each `popup.html`, is the one
per-bridge variable, and retiring the five third-party hues is the popup
redesign's job, not this change's.
