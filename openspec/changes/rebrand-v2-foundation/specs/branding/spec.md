## MODIFIED Requirements

### Requirement: Shared brand color tokens

Brand colors SHALL be defined as CSS custom properties in a shared file at the
repo root (`styles/brand-tokens.css`), outside any package, importable by the
landing page, the docs site and the editor via relative path without creating
workspace dependencies. Consumers SHALL import the file with a CSS
`@import url('<relative path>/styles/brand-tokens.css');` statement (or the
bundler's equivalent) — not via a `workspace:*` dependency — so the tokens can
be consumed by plain-HTML landing pages and bundled apps alike.

The file SHALL be organised in three layers with one direction of reference:

1. **Ramps** — fixed scales (`--n-0`…`--n-1200`, `--z1-dark`…`--z5-light`,
   `--da-*`, `--mg-*`) plus the type scale, radii and motion. Neutrals SHALL be
   chroma-0: with five data hues spanning 232° of the wheel, no tint is safe.
2. **Roles** — the only names a component may reference (`--text`, `--bg-surface`,
   `--border`, `--control`, `--zone-3`, `--danger`, …).
3. Nothing else. A role MAY read a ramp; a ramp SHALL NOT read a role.

Components SHALL reference roles only. No component SHALL reference a ramp, and
no component style SHALL use an arbitrary hex value.

Themed roles SHALL be declared in exactly two blocks: `:root` for the light
theme and a single flat `.dark` block for the dark theme. The file SHALL NOT
contain a second `.dark` block, a compound selector such as `:root, .dark`, or a
nested one — Node-side readers regex the first `.dark { … }`, and a second block
makes every theme-dependent surface fall silently back to the light values.

Any value that differs between themes — including the marketing tokens and
`--core-live` — SHALL be declared inside both of those blocks, never in a
`:root` of its own, because a custom property resolves its `var()` against the
value the referenced role holds on the same element.

The following tokens SHALL NOT exist, and SHALL NOT be reintroduced under an
alias: `--brand-accent-blue` (and its `-hover` / `-active` / `-soft` variants),
`--brand-accent-purple`, `--brand-semantic-tip` (and `-soft`),
`--brand-semantic-warning` (and `-soft`), `--brand-font-mono`, and
`--brand-text-muted`. Each collided with a training-zone hue, failed WCAG AA, or
both.

#### Scenario: A component reads a role, not a ramp

- **WHEN** a component needs a surface, an ink level, a border or an interactive fill
- **THEN** it SHALL reference a role token, and the role SHALL resolve to the correct value under both `:root` and `.dark` without the component declaring a theme variant

#### Scenario: A second dark block is rejected

- **GIVEN** `styles/brand-tokens.css`
- **WHEN** the file is inspected for `.dark` rule blocks
- **THEN** exactly one SHALL be found, and it SHALL be a flat single-class selector

#### Scenario: A retired token has no call site

- **WHEN** the repository is searched for `--brand-accent`, `--brand-semantic-tip`, `--brand-semantic-warning`, `--brand-font-mono` or `--brand-text-muted` outside the archived proposals
- **THEN** no match SHALL be found

#### Scenario: WCAG contrast

- **WHEN** a role is used for text or for a graphical object
- **THEN** the combination SHALL meet WCAG AA — 4.5:1 for body text, 3:1 for large text and for graphical objects — in both themes

### Requirement: Theme color meta tag

Both the landing page and the editor SHALL include `<meta name="theme-color">`
carrying the dark-theme page background, and the docs site SHALL derive the same
value from `styles/brand-tokens.css` rather than from a literal.

Because role tokens are `var()` references into oklch ramps, a Node-side reader
SHALL resolve the reference chain to a literal and convert it to sRGB hex before
emitting it into HTML or handing it to a rasteriser. Reading the raw declaration
text is not sufficient and SHALL NOT be done.

#### Scenario: Mobile browser chrome matches brand

- **WHEN** the landing page is opened on Android Chrome or iOS Safari
- **THEN** the browser address bar SHALL tint to the dark brand page background

#### Scenario: The resolver returns a color, not a reference

- **GIVEN** a role token whose dark-theme declaration is a `var()` reference into a ramp
- **WHEN** the Node-side reader resolves it
- **THEN** it SHALL return an sRGB hex literal, and SHALL fail loudly rather than return the unresolved reference

### Requirement: Kaiord logo SVG

The project SHALL have a product mark: a hexagonal hub with six spokes, six
outer nodes and a filled core, drawn in a 32-unit coordinate space so it needs
no scaling transform. It SHALL be published in four forms:

| Form                 | Where                         | Ink                                                   |
| -------------------- | ----------------------------- | ----------------------------------------------------- |
| `favicon.svg`        | browser tab, OG cards         | marketing magenta on a baked dark plate               |
| `mark.svg`           | landing header, ≥ 24 px       | `currentColor` throughout                             |
| `mark-core-live.svg` | app header, 28 px             | `currentColor`, core `var(--core-live, currentColor)` |
| `mark-app-icon.svg`  | installed app / dock, ≥ 64 px | ink on a baked dark plate                             |

The two `currentColor` forms SHALL be inlined into the document, not referenced
through `<img src>`: an externally-referenced SVG is an isolated document that
inherits neither `currentColor` nor `--core-live`, and both would render black.

The favicon form SHALL drop the spokes and outer nodes. At 16 px a 1.4-unit
spoke at half opacity is grey, not a spoke; the full hub SHALL NOT be used below
24 px.

The wordmark is NOT part of this requirement and is not yet redrawn.

#### Scenario: The mark inherits its ink

- **WHEN** the inlined mark is rendered inside a container with a `color`
- **THEN** every stroke and node SHALL take that color, in both themes, with no per-theme asset swap

#### Scenario: The live core falls back to ink

- **GIVEN** no `--core-live` is set on any ancestor of the app-header mark
- **WHEN** the mark renders
- **THEN** the core SHALL take `currentColor`, with no JavaScript involved

#### Scenario: The favicon is legible at 16 px

- **WHEN** the favicon renders at 16 px
- **THEN** the hexagon outline and the core SHALL both be solid, and no element SHALL render below one device pixel or at partial opacity

## ADDED Requirements

### Requirement: The marketing palette is confined to marketing surfaces

Magenta SHALL be the marketing brand colour and SHALL NOT appear on any surface
that shows athlete data. Inside the application the brand is ink: `--brand` has
no hue.

The `--mkt-*` roles SHALL be referenced only from `packages/landing/**`, from
the Open Graph card builder, and from `styles/brand-tokens.css` itself. This
SHALL be enforced mechanically as part of `pnpm lint`, not by review — the
tokens live in the same role blocks as every other token, so no file boundary
can hold the rule.

The one exception inside the product is `--core-live`: the app-header mark's
core takes the dominant training zone of the week, which is a zone hue, not a
marketing hue. Where no dominant zone can be calculated, the core SHALL inherit
ink.

#### Scenario: A product component referencing a marketing token fails lint

- **GIVEN** a file outside `packages/landing/**` and the Open Graph card builder
- **WHEN** it references any `--mkt-` custom property
- **THEN** `pnpm lint` SHALL fail, naming the file, the line and the role to use instead

#### Scenario: The boundary allowlist cannot grow

- **WHEN** the guard's allowlist is inspected
- **THEN** it SHALL be empty, and SHALL be covered by the repository's shrink-only allowlist check

### Requirement: Derived brand rasters are generated from the SVG masters

Every PNG under `assets/` SHALL be reproducible from an SVG master by a
committed script, and SHALL NOT be hand-edited. The script SHALL render the
favicon set (16, 32, 48 and the 32 px default), the 180 px apple-touch icon from
the app-icon master, and the Open Graph cards, and SHALL mirror the results into
the `public/` directory of every package that serves them.

The Open Graph card art SHALL be defined once and parameterised by subtitle, so
the landing, docs and editor cards cannot drift from each other or from the
mark.

#### Scenario: A mark change propagates to every raster

- **WHEN** an SVG master under `assets/` changes and the generator is run
- **THEN** every derived PNG under `assets/` and under each package's `public/` SHALL be rewritten from it

#### Scenario: The apple-touch icon is ink

- **WHEN** the site is added to an iOS home screen
- **THEN** the icon SHALL be the ink app-icon master, not the magenta favicon — on a home screen the user is already inside the product
