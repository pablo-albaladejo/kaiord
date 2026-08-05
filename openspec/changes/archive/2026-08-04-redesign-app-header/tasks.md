> Tasks: 48 completed, 0 deferred

## 1. Nav registry

- [x] 1.1 Move the raw destination table to `routing/nav-rows.ts` (the SPA's `max-lines` is 80, and the table plus the mapping no longer fit in one file).
- [x] 1.2 Replace `NavSurfaces.header` with `bar` / `overflow` / `accountMenu`, keeping `bottomNav` and `mobileFab`, and add `parentId` for nesting.
- [x] 1.3 Add `connections` (`/settings/connections`) as an account-menu destination and move `settings` to the account menu.
- [x] 1.4 Make `labs` `nested` under `trends`; expose `navChildrenOf`.
- [x] 1.5 Replace the "every destination sets `header`" invariant — false once Settings leaves the bar — with "exactly one desktop surface", which still fails for an unreachable destination and now also fails for a duplicated one. See design.md D1.
- [x] 1.6 Assert every nested child's parent itself has a header slot: a dropdown under an unreachable parent is unreachable.

## 2. Header nav

- [x] 2.1 Derive `BAR_ENTRIES`, `OVERFLOW_ENTRIES` and `ACCOUNT_ENTRIES` from the registry in `status-entry-defs.ts`; no surface owns a list.
- [x] 2.2 Add `NavMenu`, one component for both the Trends dropdown and the "More" overflow.
- [x] 2.3 Render an entry with children as a dropdown listing itself and them, so Trends and Labs read as parent and child.
- [x] 2.4 Keep "More" visible below `md`. The design's mobile header shows neither it nor Trends/Labs, and the bottom nav is full at five, so following the design would strand two destinations. See design.md D2.
- [x] 2.5 Hide the Nutrition row inside "More" below `md`, where the bottom nav already carries it.
- [x] 2.6 Give the "More" trigger `aria-current` when any overflow destination is active, so the tablet bar still says where you are.
- [x] 2.7 Move `BAR_WRAPPER_CLASS` beside the other header chrome and apply it to a wrapper, not the control: `Button`'s base classes hardcode `inline-flex`, which races `hidden` at equal specificity on one element.

## 3. Account menu

- [x] 3.1 Add `AccountMenu` (avatar trigger) + `AccountMenuItems` (rows), replacing `ProfileEntryButton`.
- [x] 3.2 Render the account-menu destinations from the registry, plus the docs link and the theme toggle.
- [x] 3.3 Make the theme toggle a `DropdownMenu.Item asChild` with `onSelect` prevented; give `ThemeToggle` ref/prop forwarding and compose rather than replace its `onClick`. A plain button in menu content is keyboard-unreachable — Radix `preventDefault()`s Tab. See design.md D3.
- [x] 3.4 Say "Local account" and nothing more. Local Dexie records are NOT encrypted at rest; only sync snapshots are, before upload, so the design's "Local account · encrypted" is a false security claim.
- [x] 3.5 Render the person icon, not a placeholder character, when there is no profile to abbreviate.
- [x] 3.6 Delete `StatusIndicators`, `ProfileEntryButton` and `StatusEntryButtons`.

## 4. One attention derivation

- [x] 4.1 Move `buildAttention` out of `components/pages/SettingsPage/` into `application/connections/source-attention.ts` and make it i18n-free: `{ count, cause }` with a typed cause. See design.md D4.
- [x] 4.2 Add `attention-cause-copy.ts`: one cause → one sentence, from `common.sourceHealth.*`, read by both surfaces.
- [x] 4.3 Add `hooks/connections/use-connection-attention.ts` as the single reactive model.
- [x] 4.4 Rewrite `use-settings-attention.ts` to render that model. Leave its test untouched — it still passing is the evidence the move is faithful.
- [x] 4.5 Move the three consequence strings from `settings.attention.*` to `common.sourceHealth.*` in BOTH locales, unchanged.

## 5. Source-health pill

- [x] 5.1 Add `SourceHealthPill`, rendered only when the model is non-null. No healthy variant, no grey chip, no zero badge.
- [x] 5.2 State the count and the consequence, and offer one action: all connections. Ship no "Reconnect" — that is per-source and lives on the card; a header button would have to pick a source for the user.
- [x] 5.3 Mark the avatar menu's Connections row on the same condition, and only then.
- [x] 5.4 Read the model once in `StatusHeader` and pass it to both consumers, so the pill and the dot cannot describe different moments.
- [x] 5.5 Add NO cold-load gate. `bridgeSourceStatus` returns `available` for an unconnected source, and every row reads undiscovered before the first pass, so `attention` is unreachable then. A gate here would guard a state that cannot occur. See design.md D5.
- [x] 5.6 Pin that with `source-attention.integration.test.ts` driving the REAL registry, `SESSION_PROBES` and `undiscoveredEntry` — not card fixtures.

## 6. Honesty checks against the reference design

- [x] 6.1 Ship no "stopped syncing N days ago": no transition timestamp exists. `lastCheckedAt` resets on reload; `lastSyncAt` is what the copy uses.
- [x] 6.2 Ship no "fell back to Garmin": `union` is the default multi-source mode and has no ranked winner.
- [x] 6.3 Never say "expired" — WHOOP cannot distinguish an expired token from never having signed in. Assert it: `attention-cause-copy.test.ts` fails if any cause string matches `/expir/i`.
- [x] 6.4 Confirm `tanita-bridge` can never enter the count, and assert its card status is `installed` (a count-only assertion survives deleting the no-prober guard, because its permanently-null `lastCheckedAt` trips a second one).

## 7. Test adequacy

- [x] 7.1 State, per test, the reachable state it fails on and the writer that creates it.
- [x] 7.2 Mutate each guard and record which test fails. Nine mutations run; every one killed by at least one test.
- [x] 7.3 Fix the two double-guarded tests the mutation pass exposed — one of them pre-existing (`should report an in-flight probe as checking` survived deleting the guard it names, because its fixture also had `lastCheckedAt: null`). Re-point it at a re-probe, which is the state only that guard covers.

## 8. e2e

- [x] 8.1 Add `e2e/helpers/nav.ts` to reach a destination through whichever chrome owns it at the current viewport.
- [x] 8.2 Point `lab-entry.spec.ts` at it — `status-header-labs-button` no longer exists.
- [x] 8.3 Extend `openHeaderAction` with an account-menu fallback (`menuitem`, not `button`) and add `openAccountMenu`.
- [x] 8.4 Make the legacy hamburger locator `exact`: `getByLabel` substring-matches, so "Account menu (…)" was landing in that branch. Found by running the suite locally, not by `--list`.
- [x] 8.5 Retarget the six theme-toggle assertions to `data-testid="theme-toggle"`, and the focus-indicator test to the account trigger (the toggle now sits in a Radix `FocusScope`).
- [x] 8.6 `npx playwright test --list` parses all 47 files / 1794 tests.
- [x] 8.7 Full chromium suite run locally: 280 passed, 16 skipped, 0 failed.
- [x] 8.8 **Regenerate the tracked linux visual baselines** via the `update-visual-baselines` workflow once the branch is pushed. `coaching-sidebar.visual.spec.ts` screenshots the viewport, which includes the header, so both `*-chromium-linux.png` files are now stale. They cannot be produced on macOS.

  Done on main, not on this branch: `d42c48bb` (the rebrand-v2 foundation) ran the workflow and rewrote both `*-chromium-linux.png` files, and it landed AFTER the header change `851a979d`. So the tracked baselines already show the one-row header. Verified by `git log -- …-snapshots/`: `f2478134` → `851a979d` → `d42c48bb`, each rewriting both PNGs.

## 9. Docs

- [x] 9.1 Rewrite the `LayoutHeader` / `BottomNav` entries in `docs/navigation-map.md`, which still described `StatusIndicators`, `ProfileEntryButton`, a 4-tab bottom nav and `sm:` header stacking — all wrong before this change.
- [x] 9.2 Document the three breakpoint states and why "More" survives below `md`.
- [x] 9.3 Correct `MainLayout/AGENTS.md`, which still listed a theme toggle and an onboarding-replay trigger in the header.
