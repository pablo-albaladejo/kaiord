## 1. Shell palette and type

- [x] 1.1 Add `--kd-text-disabled` and `--kd-zone-4` to the `:root` block of
      `packages/_shared/bridge-core/popup.css`, copied from their `.dark` role
      values. Add `--kd-ease: cubic-bezier(0.2, 0, 0, 1)`.
- [x] 1.2 Extend `TOKEN_SOURCES` in
      `scripts/check-bridge-popup-tokens-parity.test.mjs` with the two new
      hex tokens so the "declares a brand-token source for every `--kd-*`"
      case stays green. See design.md D6.
- [x] 1.3 Apply the V2 type scale: verdict 15px/600, cause 12.5px, caption
      12px at 0.08em/600, chips 12px, CTA 13px/500. Weights stay in
      {400, 500, 600} — the shell's 700s are gone.
- [x] 1.4 Give every numeric surface `font-variant-numeric: tabular-nums
    slashed-zero` via a `.tnum` class on the regions that carry figures.
- [x] 1.5 Replace the duration-only `transition` declarations with
      property-scoped 120ms `var(--kd-ease)` transitions.

## 2. Monogram chip replaces the accent dot

- [x] 2.1 Replace `.popup-header__dot` with `.popup-header__mark` (22px,
      6px radius, `--kd-border-soft` on `--kd-text-primary`) plus `--muted`
      and `--solo` modifiers. See design.md D3.
- [x] 2.2 Widen `.popup-header` to `22px 1fr 22px` at 10px gap and grow
      `.popup-header__refresh` to 22px so the three slots align.
- [x] 2.3 Delete the `<style>` block declaring `--accent` / `--accent-hover`
      from all five `popup.html` files and render the monogram span with the
      bridge's initials (`G`, `T2`, `Wh`, `Ta`, `TP`).
- [x] 2.4 Swap the `⟳` glyph for the `i-sync` sprite icon, and add the
      sprite (`i-sync` + `i-attn`) to each `popup.html`.
- [x] 2.5 Assert per bridge that its `popup.html` declares no `--accent` and
      carries no `#rrggbb` literal ("carries no provider hue in its markup").

## 3. Status block: mark, verdict, cause, date

- [x] 3.1 Add `bridge-popup-health.js` to `packages/_shared/bridge-core/`
      exposing `readHealth()`, `nextHealth()` and `recordProbe()` over the
      `bridgeHealth` key in `chrome.storage.local`. See design.md D1 and D2.
- [x] 3.2 Register the new master (and its vendored test) in
      `BRIDGE_CORE_MASTERS`, and load it from every `popup.html` before
      `popup.js`.
- [x] 3.3 Add `formatSinceDate(epochMs, now)` to `bridge-popup-utils.js`: day
      and short month, with the year appended only when it differs from now.
- [x] 3.4 Give `renderStatusBlock` a `mark` option — `dot` (default) or
      `alert`, the latter rendering the `i-attn` sprite. See design.md D4.
- [x] 3.5 Add the `--checking` tone (idle dot, 1.2s pulse) and animate the
      `--ok` dot at 1.8s; suppress both under `prefers-reduced-motion`.
- [x] 3.6 Add a dated cause variant per bridge alongside each dateless one,
      and select between them on the health record's `since`.
- [x] 3.7 Verify every broken state's primary CTA is the fix at the source and
      the editor is secondary. All five already were; Tanita and TrainingPeaks
      adopted the V2's "Open <source>" / "Set up in Kaiord ↗" pair and WHOOP
      its "Review in Kaiord ↗" secondary.

## 4. Skeleton at final height

- [x] 4.1 Reshape `renderSkeleton($, regions)` to take a region/parts list,
      defaulting to today's chips + footer pair. See design.md D5.
- [x] 4.2 Declare the full region set in each popup: WHOOP adds
      `consequence-region`, TrainingPeaks adds `future-region` and
      `consequence-region`, Tanita adds `consequence-region`, Garmin adds
      `athlete-region` and `rollup-region`, Train2Go adds `athlete-region`,
      `week-region` and `notes-region`.
- [x] 4.3 Add `skeleton--block`, `skeleton--block-sm` and
      `skeleton--secondary` shapes and size each placeholder to the layout it
      stands in for.
- [x] 4.4 Assert per bridge that every region a resolved state fills carries a
      placeholder during the check.

## 5. Chips, consequence and the one earned hue

- [x] 5.1 Restyle chips to the V2 metrics (3px/9px, 12px).
- [x] 5.2 Add `.chip--more` for the "+N more" collapse chip: no fill,
      `--kd-border-soft`, `--kd-text-muted`; WHOOP's more-chip uses it.

  > Deferred to: the SPA. `.chip--danger` is NOT shipped — the
  > broken-vs-paused distinction the V2 paints it for is routing state no
  > bridge extension can see. See the proposal's "No danger-tinted chip".

- [x] 5.3 Drop the border and fill from `.consequence` — the V2 renders those
      lines as plain 12px `--kd-text-muted` prose.
- [x] 5.4 Raise `.chips-box` to a 12px radius and move its caption to
      `--kd-text-secondary`.
- [x] 5.5 Add `.lastpush` (12px radius, `--kd-bg-elevated`, 4px
      `--kd-zone-4` left edge) and render Garmin's last push through it.
- [x] 5.6 Rebuild Train2Go's weekly rollup as three 20px/600 figures with
      12px labels over a 6px track; `rollup-region` becomes `week-region`.
- [x] 5.7 Restyle Train2Go's coach-notes disclosure as a bordered summary row
      with an unboxed body.

## 6. Copy through `_locales`

- [x] 6.1 Add every new key to both the bridge's `KAIORD_POPUP_MESSAGES`
      fallback table and its `_locales/en/messages.json`, with a
      `description` on each locale entry.
- [x] 6.2 Adopt the V2 state copy where the screen specifies it: WHOOP's
      "Session expired" and "Review in Kaiord ↗", Tanita's and
      TrainingPeaks' CTA pairs, and the manual-entry consequence lines.
- [x] 6.3 Keep every chip label derived from what the bridge actually moves —
      the screen's Garmin and Train2Go chip inventories are NOT ported. See
      design.md D7.
- [x] 6.4 Confirm no `_locales/` directory other than `en` is created
      (R-BridgeLocalesEnglishOnly).

## 7. Verification

- [x] 7.1 `pnpm bridge:sync`, then `check-bridge-core-parity` confirms the
      vendored copies are byte-identical.
- [x] 7.2 `pnpm -r build`.
- [x] 7.3 All five bridge suites, including the two the briefing believed CI
      skipped (`trainingpeaks-bridge`, `tanita-bridge` — both have been in
      the CI matrix since `check-bridge-ci-coverage.test.mjs` landed).
      597 → 737 tests.
- [x] 7.4 `pnpm test:scripts` — core parity, popup token parity, message
      parity, locales-english-only, privacy surface, CI coverage.
- [x] 7.5 `pnpm lint` at `--max-warnings=0`, then `pnpm lint:specs`.
