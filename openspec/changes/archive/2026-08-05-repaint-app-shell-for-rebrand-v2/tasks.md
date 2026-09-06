> Tasks: 24 completed, 0 deferred

## 1. Semantic hues leave the shell

- [x] 1.1 Add `alert` (lucide `TriangleAlert`) to `ICON_MAP`. It is the substitution the handoff names for the retired `--brand-semantic-warning`, and nothing in the map carried it.
- [x] 1.2 Split `sport-icons.ts` out of `icon-map.ts` to make room: the map's import and entry took the file to 81 counted lines against an 80 cap. Sport glyphs are the cohesive group — `sport-icon-name.ts` already sits beside them — and they are spread back in, so `ICON_MAP.bike` and the `IconName` union are unchanged and no other file moves. Checked first that no map entry was dead: `today` and `labs` look unused to a grep for `ICON_MAP.<key>`, but `nav-rows.ts` reaches them positionally as tuple fields.
- [x] 1.3 Repaint `SourceHealthPill`'s trigger to `border-edge bg-surface-elevated text-ink-strong` and swap its amber dot for the alert icon. The reference calls this out by name: amber is Z4, so severity moves to the icon, the sentence and the panel.
- [x] 1.4 Replace `ATTENTION_DOT_CLASS` with `ATTENTION_ICON_CLASS` and render the alert icon on the account menu's Connections row. Testid `account-menu-connections-dot` → `account-menu-connections-attention`; "dot" would name a thing that no longer exists.
- [x] 1.5 Leave the render CONDITION untouched — `attention === null` still renders nothing. This change is about what the signal looks like, not when it fires.
- [x] 1.6 Repaint the setup checklist's progress rail from `bg-emerald-400` to `bg-accent`, and drop `color="success"` / `color="primary"` from its tick and chevron in favour of `inherit`.

## 2. The FAB stops being the retired accent blue

- [x] 2.1 Replace `FAB_STYLE`'s `linear-gradient(160deg, #38bdf8, #0284c7)` and its blue-tinted shadow with `var(--control)` / `var(--control-ink)` / `var(--shadow-float)`. These were the last two hex literals in the shell.
- [x] 2.2 Make the FAB pill-radius and set its offset to the reference's `-11px`; drop `text-white`, which the inline `color` now supplies.
- [x] 2.3 Leave the bar geometry alone: glass `h64`, `inset-x-[14px] bottom-[14px]`, `rounded-[24px]`, 58 px FAB, notch at index 3. Verified against the reference's inline styles, which match it exactly.

## 3. The avatar is ink

- [x] 3.1 Repaint `AVATAR_CLASS` from `bg-primary-600 text-white` to `bg-edge-soft text-ink-strong`, and give the trigger the reference's `border-edge` hairline.
- [x] 3.2 Drop `font-bold` to `font-semibold` — the type scale tops out at 600.

## 4. Raw greys → roles (#1121, shell files only)

- [x] 4.1 `LayoutHeader` and `MainLayout`: `border-gray-200 bg-white dark:…` → `border-edge bg-surface`, `bg-gray-50 dark:bg-slate-900` → `bg-surface-page`.
- [x] 4.2 `HeaderLogo`: `text-gray-900 dark:text-white` → `text-ink-strong`, with display tracking.
- [x] 4.3 `KeyChips`: the chip becomes `border-edge bg-surface-elevated text-ink-strong` at `rounded-lg`. Shared by the palette, the sheet and the coach mark, so it is repainted once.
- [x] 4.4 The six `CommandPalette` files: content, input, rows, list heading, body and footer.
- [x] 4.5 Both `ShortcutSheet` files.
- [x] 4.6 `CoachMarkCard`.
- [x] 4.7 Card radii to 16 px (`sm:rounded-2xl` / `rounded-2xl`) on the palette, the sheet and the coach mark, and every `font-bold` in these files down to `font-semibold`.
- [x] 4.8 Leave `atoms/Icon`'s `colorClasses` alone and say so in the proposal. Every screen in the tree consumes it; repainting it here would collide with every other wave.
- [x] 4.9 Delete the dead `MENU_LABEL_CLASS` export from `header-menu-styles.ts` — exported, zero call sites, and the file was open anyway.

## 5. Verification

- [x] 5.1 `pnpm -r build` clean.
- [x] 5.2 `pnpm --filter @kaiord/workout-spa-editor test` — 890 files, 6334 tests, 0 failures.
- [x] 5.3 `pnpm lint` green, including `lint:theme-dialect`, `lint:mkt-boundary` and eslint at `--max-warnings=0`.
- [x] 5.4 Definition-of-done greps over the shell: no hex literal, no raw `slate-*`/`gray-*`, no semantic hue.
