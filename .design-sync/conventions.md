# Kaiord Design System — how to build with it

Kaiord is a health & fitness app: workout editing, training calendars, and
health data. The components below are its real, shipped React components.

## Wrapping and setup

Every design must be wrapped in `ThemeProvider`. It owns the theme state and is
what applies the `dark` class to `document.documentElement`; without it, any
component calling `useTheme` throws, and the dark palette never activates.

Components that render text go through i18n, and several read user preferences
(units, connected devices). The full chain, outermost first:

```jsx
<ThemeProvider defaultTheme="light">
  <LocaleProvider>
    <UnitsProvider>
      <GarminBridgeProvider>{/* your design */}</GarminBridgeProvider>
    </UnitsProvider>
  </LocaleProvider>
</ThemeProvider>
```

`ThemeProvider` alone is enough for purely presentational components (`Button`,
`Icon`, `Badge`, `Pill`). Add the rest when a component shows copy, formats a
distance or duration, or reflects device state.

**Dark mode is a class, not a media query**: styles switch on `.dark` on the
root element. To show a dark design, pass `defaultTheme="dark"` — do not
hand-write dark colors.

## The styling idiom: Tailwind v4 utilities over semantic roles

This is a Tailwind v4 system, but **the color scale is semantic, not raw**.
Components name a _role_ (`bg-surface`, `text-ink-muted`); they never name a raw
Tailwind hue. The repo mechanically forbids raw chromatic utilities like
`bg-red-600` — use the ramps below, and your layout glue will match the library.

| Family         | Utilities                                                                 | Use for                                           |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Surfaces       | `bg-surface`, `bg-surface-elevated`, `bg-surface-page`, `bg-surface-deep` | Page ground, cards, raised panels, wells          |
| Text           | `text-ink-strong`, `text-ink-body`, `text-ink-muted`                      | Headings, body copy, secondary/meta text          |
| Borders        | `border-edge`, `border-edge-soft`, `border-edge-strong`                   | Dividers and card outlines                        |
| Accent         | `text-accent`, `bg-accent`, `border-accent`                               | Emphasis and links                                |
| Action         | `bg-action`, `text-action-ink`                                            | Primary interactive fills                         |
| Danger         | `bg-danger`, `bg-danger-bg`, `text-danger-text`, `border-danger-border`   | Destructive actions, errors                       |
| Primary ramp   | `bg-primary-{300..700}`, `text-primary-{400,600}`, `border-primary-500`   | Neutral-dark brand ramp                           |
| Training zones | `bg-zone-{1..5}`, `border-zone-{1..5}`                                    | Intensity zones — the one place hue is meaningful |

Radii in use: `rounded-md` and `rounded-lg` for controls and cards,
`rounded-xl`/`rounded-2xl` for sheets and large panels, `rounded-full` for pills
and avatars. Spacing, type scale and layout use stock Tailwind utilities.

Type is Inter (`--font-sans`), shipped with the bundle.

## Where the truth lives

- `_ds/<folder>/styles.css` and its `@import` closure — the compiled stylesheet.
  It defines every role token above; read it before inventing a color.
- `components/<group>/<Name>/<Name>.d.ts` — the real prop contract.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component usage notes.
- `guidelines/` — the team's own UX docs (modal system, keyboard shortcuts,
  navigation map, UX glossary).

Components are grouped `atoms` → `molecules` → `organisms` → `templates`.
Prefer composing existing molecules over rebuilding them from atoms.

## An idiomatic example

```jsx
<ThemeProvider defaultTheme="light">
  <LocaleProvider>
    <div className="bg-surface-page min-h-screen p-6">
      <div className="bg-surface border-edge mx-auto max-w-2xl rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-ink-strong text-lg font-semibold">Today</h2>
          <Badge>warmup</Badge>
        </div>
        <p className="text-ink-muted mb-4 text-sm">
          Easy pace, focus on form and breathing
        </p>
        <div className="flex gap-2">
          <Button variant="primary">Start workout</Button>
          <Button variant="secondary">Edit</Button>
          <Button variant="danger" size="sm">
            Delete
          </Button>
        </div>
      </div>
    </div>
  </LocaleProvider>
</ThemeProvider>
```

The library component carries the control; the surrounding layout uses the same
role utilities, so it stays on-brand in both themes.
