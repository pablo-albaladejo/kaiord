# Rebrand V2 · foundation

## Why

`styles/brand-tokens.css` sets all 27 chromatic tokens to stock Tailwind
values, and the design audit measured four collisions in them:

| #   | Collision                           | Measurement                                                                                      |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | `--brand-accent-blue` vs `--zone-2` | 5° of hue apart. Every primary button was painted the colour that means "easy endurance".        |
| 2   | `--brand-text-muted` vs `--zone-1`  | Byte-identical (`#64748b`). A text level and a chart colour were the same value.                 |
| 3   | Zone ramp vs semantic ramp          | 3–14° apart. Z5 vs danger = 3°.                                                                  |
| 4   | Light-theme zones                   | Z2/Z3/Z4 give 2.15–2.77:1 on white — below the 3:1 floor WCAG 1.4.11 sets for graphical objects. |

Two accents also fail AA outright: accent blue is 3.57:1 on the dark surface
and 4.10:1 on white; accent purple is 3.32:1.

A palette cannot be repaired one token at a time when the problem is that
chart colour and UI colour occupy the same arc of the wheel. The replacement
is achromatic neutrals + five zone hues + one danger ramp, with the brand
colour rationed: **inside the login the brand is ink**, magenta exists only on
marketing surfaces, and the product's one live accent is the header mark's
core, which takes the dominant training zone of the week.

This proposal lands the foundation only — the palette, every call site that
referenced a retired token, the mark, and the lint rule that holds the magenta
boundary. The sixteen redesigned screens follow in later changes and depend on
these tokens existing.

## What Changes

- **`styles/brand-tokens.css` is replaced wholesale** with a three-layer file:
  ramps (fixed scales, oklch, chroma-0 neutrals) → roles (the only names the UI
  may use) → a temporary alias layer. A role may read a ramp; a ramp may never
  read a role. The single-flat-`.dark`-block invariant is preserved and
  restated, because three Node-side readers regex the first `.dark { … }`.

- **Five token groups are deleted with no alias, on purpose.**
  `--brand-accent-blue` (with its `-hover` / `-active` / `-soft` variants),
  `--brand-accent-purple`, `--brand-semantic-tip` (with `-soft`),
  `--brand-semantic-warning` (with `-soft`) and `--brand-font-mono` — eleven
  token names in all. Aliasing them would reintroduce the collisions this
  rebuild exists to remove, so the call site is meant to break. A sixth token,
  `--brand-text-muted`, is retired on its own: it was byte-identical to
  `--zone-1`.

- **Every `--brand-*` call site migrates to a role**, and the alias layer is
  then deleted from both role blocks. 263 references across the landing page,
  the docs theme, the editor SPA and the two OG generators.

- **The Node-side token readers learn to resolve.** Role tokens are `var()`
  chains into oklch ramps, so a reader that returned the raw declaration text
  would hand `var(--n-1200)` to `<meta name="theme-color">` and to `sharp`.
  A shared resolver follows the chain to a ramp literal and converts oklch to
  sRGB hex, so the theme-color tag, both OG cards and the bridge-popup parity
  guard keep reading one source of truth.

- **The bridge popups get the new palette.** The five extensions cannot import
  CSS from the repo, so the popup master re-declares the dark palette as
  `--kd-*` literals; those literals are repainted and their parity guard is
  re-pinned to the new role names. Token swap only — the popup UX redesign is
  a later change.

- **The mark ships.** `assets/favicon.svg` is replaced by the magenta mark;
  `mark.svg`, `mark-core-live.svg` and `mark-app-icon.svg` join it. The two
  `currentColor` marks are inlined as React components, because an SVG loaded
  through `<img src>` is an isolated document that inherits neither
  `currentColor` nor `--core-live` and would render black.

- **A mechanical guard holds the magenta boundary.** `styles/brand-tokens.css`
  declares the `--mkt-*` roles and the landing and the OG card renderer consume
  them; a reference from anywhere else fails `pnpm lint`. A separate CSS file
  would not hold this, because any consumer that imports the tokens can reach
  them; a lint rule does.

## What is deliberately NOT built

- **The wordmark is not redrawn.** Outlining "Kaiord" needs the Inter 600
  `.woff2`, and a `<text>`-based logo breaks the moment it leaves a browser.
  `assets/logo.svg` keeps the old geometry until the wordmark is redrawn, and
  its call sites move to the new mark in the meantime. `assets/logo-symbol.svg`
  is deleted outright — it was the symbol alone, which `mark.svg` now is.

  > Deferred to: #1120

- **The sixteen screens are untouched.** No component's layout, copy or
  information architecture changes here. Where a retired token was the only
  thing holding a rule together, the rule is repointed at the role that
  replaces it — nothing more.

- **The SPA's `primary-*` Tailwind ramp survives as neutrals.** 179 component
  call sites reference `bg-primary-600`, `ring-primary-500` and friends, and
  two test suites pin those exact class names. The ramp is repointed onto the
  chroma-0 neutrals so no blue survives inside the product, but the utilities
  keep their names until the screen waves replace them with roles.

  > Deferred to: #1119

- **The 192/512 manifest PNGs are not shipped**, and the derived favicon PNGs
  are not regenerated: the repo has no SVG→PNG rasteriser wired for
  `assets/`, and adding a dependency to a foundation change is the wrong
  trade. The SVG favicon is what every current browser reads.
