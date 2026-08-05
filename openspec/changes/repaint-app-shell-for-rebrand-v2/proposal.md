## Why

The one-row header, the ⌘K palette, the `?` shortcut sheet, the setup
checklist and the coach marks all shipped before the V2 palette existed. They
were built in the dialect that palette replaced, so the shell — the one part of
the product on every route — is now the least V2 surface in the tree.

Three concrete defects, not just a stale look:

1. **The create FAB is painted `#38bdf8 → #0284c7`.** That is the retired
   accent blue, baked as two hex literals in `bottom-nav-styles.ts`. It sits 5°
   from `--zone-2`, so the button that means "new workout" is drawn in the
   colour that means "easy endurance", and it violates the definition-of-done
   grep for literal hex in component source.
2. **The source-health pill is amber.** Amber is `--zone-4` now. A warning
   sharing a hue with the athlete's threshold zone competes with their own
   data, and `--brand-semantic-warning` was retired precisely to stop this. The
   same amber dot marks the account menu's Connections row.
3. **The setup checklist's progress rail is `bg-emerald-400`.** Success left
   the palette entirely; the rail asserts a semantic the system does not have.

Underneath those, the shell files still paint in raw `slate-*`/`gray-*`
utilities (#1121's inheritance) and in `bg-primary-600`, the transitional
bridge #1119 exists to retire.

## What Changes

- **The pill loses its amber.** `SourceHealthPill` becomes a neutral control —
  `border-edge bg-surface-elevated text-ink-strong` — and states severity with
  a `triangle-alert` icon plus the sentence it already carried. The account
  menu's Connections dot becomes the same icon. `ICON_MAP` gains `alert`.
  Silence when healthy is unchanged: the pill still renders nothing at all when
  the attention model is null.
- **The FAB becomes flat `--control` on `--control-ink`**, pill-radius, with
  `--shadow-float`. The two hex literals go. The bar geometry it sits in —
  glass `h64`, inset 14, radius 24, 58 px FAB in the notch at index 3 — is
  untouched.
- **The avatar chip stops being a filled accent.** `bg-edge-soft
text-ink-strong`, matching the reference: inside the login the brand is ink,
  and the only tinted pixels in the shell are the mark's live core.
- **The checklist's rail becomes `bg-accent`**, and its done-tick and next-step
  chevron inherit their row's colour instead of asserting `success`/`primary`.
- **Thirteen shell files are repainted from raw Tailwind greys to roles** —
  `LayoutHeader`, `MainLayout`, `HeaderLogo`, `KeyChips`, the six
  `CommandPalette` files, both `ShortcutSheet` files and `CoachMarkCard`.
- **Card radii go to 16 px** (`sm:rounded-2xl`) on the palette, the shortcut
  sheet and the coach mark, and every weight above 600 drops to 600.

Out of scope, deliberately: `atoms/Icon`'s `colorClasses` map still carries
`success`/`warning`/`danger` hues and grey defaults. It is consumed by every
screen in the tree, so repainting it belongs to #1121 as one atomic change, not
to one wave's shell PR. Also out of scope: wiring `--core-live` to the week's
dominant zone (#1118) and retiring the `primary-*` scale (#1119).

## Capabilities

### Modified Capabilities

- `branding`: the shell chrome is added to the surfaces the role layer governs,
  and the no-semantic-hue rule is stated where a reviewer will meet it.
