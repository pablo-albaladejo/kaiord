# Tasks · Rebrand V2 foundation

## 1. The palette

- [x] 1.1 Replace `styles/brand-tokens.css` with the layered file: ramps → roles. Every token value byte-identical to the design bundle; comments translated to English per the repo's language rule.
- [x] 1.2 Keep the `@font-face` rule above layer 1, with its cross-surface invariant comment. See design.md D1.
- [x] 1.3 Verify exactly one `.dark {` in the file, flat, no compound selector, no second block.
- [x] 1.4 Ship no migration-alias layer at all: every call site moves in this change, so the aliases would be born dead. See design.md D3.

## 2. Node-side token resolution

- [x] 2.1 Add `scripts/brand-tokens.mjs`: read the first flat `.dark` block with the whole file as fallback, follow `var()` chains to a literal, convert `oklch(L C H)` to sRGB hex. Bound the chain at 8 hops. See design.md D2.
- [x] 2.2 Add `scripts/brand-tokens.test.mjs` covering resolution, the oklch conversion, the hop bound, the missing-token error and the `--`-prefix guard.
- [x] 2.3 Re-export the resolver from `packages/docs/.vitepress/brand-tokens.mjs` so the VitePress head and its tests keep their import path.
- [x] 2.4 Delete `packages/docs/scripts/brand-tokens.test.mjs`: its subject is now a pure re-export barrel, and the resolver is covered at `scripts/brand-tokens.test.mjs` (R-NoBarrelTestSuite).

## 3. Call sites — editor SPA

- [x] 3.1 `src/index.css`: alias every surface / ink / edge local token to its role; drop the `.dark` overrides that the roles now carry.
- [x] 3.2 Repoint `--accent` to `--control`; drop the sky-400 dark override.
- [x] 3.3 Replace the `--glass-*` and `--ring-track` hex/rgba literals with `color-mix` over roles and `--shadow-float`.
- [x] 3.4 Repoint `--color-primary-*` onto the neutral ramp; delete `--color-secondary-*` (zero call sites). See design.md D5.
- [x] 3.5 Delete the `@theme` font mappings; verify `font-sans` still resolves to Inter in the built CSS. See design.md D4.

## 4. Call sites — landing

- [x] 4.1 `index.html`: migrate every `var(--brand-*)` to its role; accent blue and purple become `--mkt-brand` / `--mkt-cta` / `--mkt-cta-ink`, this being a marketing surface.
- [x] 4.2 Drop the `--brand-font-mono` mapping. The landing's `font-mono` utilities keep Tailwind's default stack — byte-identical to the retired token's value — because they sit on real code samples. Retyping the format badges as tabular sans is landing-redesign work.
- [x] 4.3 `src/install-widget.ts` and `scripts/build-locales.mjs`: same migration for the class strings they build.
- [x] 4.4 `src/main.css`: drop the `@theme` font mappings.
- [x] 4.5 Swap the inline hub SVG in the header for the new mark geometry.

## 5. Call sites — docs

- [x] 5.1 `.vitepress/theme/custom.css`: map the VitePress variables to roles; `--vp-c-brand-*` to the control ramp, with `--vp-button-brand-text` set to `--control-ink` so a dark-theme button is not white on white.
- [x] 5.2 Replace the tip / warning containers with elevated surface + border + text.
- [x] 5.3 Drop the `--vp-font-family-mono` override rather than repointing it: a docs site is the one surface where `mono` really is code, and VitePress's default stack is what the retired token already resolved to.

## 6. Bridge popups

- [x] 6.1 Repaint the `--kd-*` literals in `packages/_shared/bridge-core/popup.css` from the new dark role values. Token swap only — no layout or copy change.
- [x] 6.2 Re-pin `scripts/check-bridge-popup-tokens-parity.test.mjs` to the role names, resolving through `scripts/brand-tokens.mjs`.
- [x] 6.3 `pnpm bridge:sync` and confirm the five vendored copies are byte-identical to the master.
- [x] 6.4 Run the popup suites of all five bridges, including `trainingpeaks-bridge` and `tanita-bridge`, which CI does not run.

## 7. Retire layer 3

- [x] 7.1 `grep -r '--brand-' src/ packages/ styles/` returns only `styles/brand-tokens.css`.
- [x] 7.2 Confirm no alias block was ever shipped, so there is none to delete.

## 8. The mark

- [x] 8.1 Overwrite `assets/favicon.svg` with the magenta mark; add `mark.svg`, `mark-core-live.svg`, `mark-app-icon.svg`.
- [x] 8.2 Add `atoms/BrandMark/` — hand-written geometry, `currentColor`, `fill="var(--core-live, currentColor)"` on the core. No new dependency. See design.md D6.
- [x] 8.3 Use it at 28px in the app header, replacing the inline pre-rebrand hub.
- [x] 8.4 Audit `assets/logo.svg` / `assets/logo-symbol.svg`: symbol-only call sites move to the new mark; the wordmark stays until it is redrawn.
- [x] 8.5 Add `scripts/brand-og-card.mjs` and point the landing, docs and editor OG generators at it. See design.md D7.
- [x] 8.6 Add `scripts/build-brand-images.mjs` + `pnpm brand:images`: rasterise the favicon PNG set and `apple-touch-icon.png`, render the landing OG card, bake the docs nav marks, mirror into each `public/`. The docs and editor cards keep their own package-local generators.
- [x] 8.7 Confirm no code path still loads the old blue hub: `index.html` of both apps, the docs head, the OG cards.

## 9. The magenta boundary

- [x] 9.1 Add `scripts/check-mkt-boundary.mjs` (+ test): `--mkt-` outside `packages/landing/**`, the OG card builder and the token file fails. Empty `ALLOWLIST`. See design.md D8.
- [x] 9.2 Wire `lint:mkt-boundary` into `lint:parallel`, and register the allowlist with `check-allowlists-empty.mjs`.

## 10. Specs and docs

- [x] 10.1 Delta-spec `branding`: the token contract, the mark, the magenta boundary, the theme-color source.
- [x] 10.2 Refresh `styles/AGENTS.md` and `assets/AGENTS.md` for the new layering, names and generator.
- [x] 10.3 Changeset for the public packages the repaint touches.

## 11. Verification

- [x] 11.1 `pnpm build` (workspace).
- [x] 11.2 `pnpm -r test` and `pnpm test:scripts`.
- [x] 11.3 `pnpm lint` (eslint `--max-warnings=0`), `pnpm lint:specs`.
- [x] 11.4 Definition-of-done greps: no retired token anywhere; no hex literal in component source; `--mkt-` only on the landing and the OG card; exactly one flat `.dark`.

## 12. Deliberately out of scope

Recorded here so the screen waves inherit them rather than rediscover them.
No issue numbers yet — they are assigned when the follow-up is filed.

- **`--core-live` is not wired to a zone.** No derivation of the week's
  dominant training zone exists; rolling per-session zone data up to a week is
  what the Calendar wave builds. The mark's own fallback renders ink, which is
  also the correct empty-week rendering.
- **The SPA's `primary-*` utilities survive as neutrals.** Retiring them means
  flipping `text-white` to `text-control-ink` at 179 call sites so a dark-theme
  primary button is light rather than dark-on-dark, plus two pinned suites.
- **The wordmark is not redrawn.** It needs the Inter 600 `.woff2` outlined;
  `assets/logo.svg` keeps the pre-rebrand geometry until then.
- **The landing keeps its emerald / amber format-support hues** and its
  `font-extrabold` display type. Those encode a separate semantic and belong to
  a landing redesign, not to a token migration.
- **The five per-bridge popup accent dots keep their third-party hues.** The
  handoff retires them in favour of a monogram chip, which is popup-redesign
  work; this change swapped tokens only.
- **`utils/step-colors.ts` still returns literal hues** for step intensity and
  target type. The Editor wave replaces them, and it is the wave that also
  stops tinting the repetition block.
