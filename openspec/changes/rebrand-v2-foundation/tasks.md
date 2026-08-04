# Tasks · Rebrand V2 foundation

## 1. The palette

- [ ] 1.1 Replace `styles/brand-tokens.css` with the three-layer file: ramps → roles → migration aliases. Every token byte-identical to the design bundle.
- [ ] 1.2 Keep the `@font-face` rule above layer 1, with its cross-surface invariant comment. See design.md D1.
- [ ] 1.3 Verify exactly one `.dark {` in the file, flat, no compound selector, no second block.
- [ ] 1.4 Verify the layer-3 aliases are declared inside BOTH role blocks, not in a `:root` of their own.

## 2. Node-side token resolution

- [ ] 2.1 Add `scripts/brand-tokens.mjs`: read the first flat `.dark` block with the whole file as fallback, follow `var()` chains to a literal, convert `oklch(L C H)` to sRGB hex. Bound the chain at 8 hops. See design.md D2.
- [ ] 2.2 Add `scripts/brand-tokens.test.mjs` covering resolution, the oklch conversion, the hop bound, the missing-token error and the `--`-prefix guard.
- [ ] 2.3 Re-export the resolver from `packages/docs/.vitepress/brand-tokens.mjs` so the VitePress head and its tests keep their import path.
- [ ] 2.4 Repoint `packages/docs/scripts/brand-tokens.test.mjs` at the role tokens and their resolved values.

## 3. Call sites — editor SPA

- [ ] 3.1 `src/index.css`: alias every surface / ink / edge local token to its role; drop the `.dark` overrides that the roles now carry.
- [ ] 3.2 Repoint `--accent` to `--control`; drop the sky-400 dark override.
- [ ] 3.3 Replace the `--glass-*` and `--ring-track` hex/rgba literals with `color-mix` over roles and `--shadow-float`.
- [ ] 3.4 Repoint `--color-primary-*` onto the neutral ramp; delete `--color-secondary-*` (zero call sites). See design.md D5.
- [ ] 3.5 Delete the `@theme` font mappings; verify `font-sans` still resolves to Inter in the built CSS. See design.md D4.

## 4. Call sites — landing

- [ ] 4.1 `index.html`: migrate every `var(--brand-*)` to its role; accent blue and purple become `--mkt-brand` / `--mkt-cta` / `--mkt-cta-ink`, this being a marketing surface.
- [ ] 4.2 Replace `font-mono` with `tabular-nums slashed-zero` on the figures that wanted alignment, and leave the code samples on the sans stack.
- [ ] 4.3 `src/install-widget.ts` and `scripts/build-locales.mjs`: same migration for the class strings they build.
- [ ] 4.4 `src/main.css`: drop the `@theme` font mappings.
- [ ] 4.5 Swap the inline hub SVG in the header for the new mark geometry.

## 5. Call sites — docs

- [ ] 5.1 `.vitepress/theme/custom.css`: map the VitePress variables to roles; `--vp-c-brand-*` to the control ramp, with `--vp-button-brand-text` set to `--control-ink` so a dark-theme button is not white on white.
- [ ] 5.2 Replace the tip / warning containers with elevated surface + border + text.
- [ ] 5.3 Point `--vp-font-family-mono` at the sans stack.

## 6. Bridge popups

- [ ] 6.1 Repaint the `--kd-*` literals in `packages/_shared/bridge-core/popup.css` from the new dark role values. Token swap only — no layout or copy change.
- [ ] 6.2 Re-pin `scripts/check-bridge-popup-tokens-parity.test.mjs` to the role names, resolving through `scripts/brand-tokens.mjs`.
- [ ] 6.3 `pnpm bridge:sync` and confirm the five vendored copies are byte-identical to the master.
- [ ] 6.4 Run the popup suites of all five bridges, including `trainingpeaks-bridge` and `tanita-bridge`, which CI does not run.

## 7. Retire layer 3

- [ ] 7.1 `grep -r '--brand-' src/ packages/ styles/` returns only `styles/brand-tokens.css`.
- [ ] 7.2 Delete the alias block from BOTH role blocks.

## 8. The mark

- [ ] 8.1 Overwrite `assets/favicon.svg` with the magenta mark; add `mark.svg`, `mark-core-live.svg`, `mark-app-icon.svg`.
- [ ] 8.2 Add `atoms/BrandMark/` — hand-written geometry, `currentColor`, `fill="var(--core-live, currentColor)"` on the core. No new dependency. See design.md D6.
- [ ] 8.3 Use it at 28px in the app header, replacing the inline pre-rebrand hub.
- [ ] 8.4 Audit `assets/logo.svg` / `assets/logo-symbol.svg`: symbol-only call sites move to the new mark; the wordmark stays until it is redrawn.
- [ ] 8.5 Add `scripts/brand-og-card.mjs` and point the landing, docs and editor OG generators at it. See design.md D7.
- [ ] 8.6 Add `scripts/build-brand-images.mjs` + `pnpm brand:images`: rasterise the favicon PNG set and `apple-touch-icon.png`, render the three OG cards, mirror into each `public/`.
- [ ] 8.7 Confirm no code path still loads the old blue hub: `index.html` of both apps, the docs head, the OG cards.

## 9. The magenta boundary

- [ ] 9.1 Add `scripts/check-mkt-boundary.mjs` (+ test): `--mkt-` outside `packages/landing/**`, the OG card builder and the token file fails. Empty `ALLOWLIST`. See design.md D8.
- [ ] 9.2 Wire `lint:mkt-boundary` into `lint:parallel`, and register the allowlist with `check-allowlists-empty.mjs`.

## 10. Specs and docs

- [ ] 10.1 Delta-spec `branding`: the token contract, the mark, the magenta boundary, the theme-color source.
- [ ] 10.2 Refresh `styles/AGENTS.md` and `assets/AGENTS.md` for the new layering, names and generator.
- [ ] 10.3 Changeset for the public packages the repaint touches.

## 11. Verification

- [ ] 11.1 `pnpm build` (workspace).
- [ ] 11.2 `pnpm -r test` and `pnpm test:scripts`.
- [ ] 11.3 `pnpm lint` (eslint `--max-warnings=0`), `pnpm lint:specs`.
- [ ] 11.4 Definition-of-done greps: no retired token anywhere; no hex literal in component source; `--mkt-` only on the landing and the OG card; exactly one flat `.dark`.
