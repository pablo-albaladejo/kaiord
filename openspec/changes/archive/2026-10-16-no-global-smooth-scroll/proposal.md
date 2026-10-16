> Completed: 2026-10-16

# Proposal: drop the global smooth scroll

## Why

`html { scroll-behavior: smooth }` (added for mobile, "Requirement 8") made
every scroll the app or the browser starts without naming a behaviour glide
for ~200 ms: route and section resets, focus moves, `scrollIntoView`, and
Playwright's own retry scrolls. It never served its stated use. The CSS only
animates programmatic and fragment scrolls. The SPA's fragment holds the route
(`#/settings/ai`), not an in-page anchor, and there are no `href="#id"` links.
A finger or wheel scroll is never affected.

What it did do was move the page under a press that had already started. The
release landed on another element, the browser sent the `click` to their
common ancestor, and the press was lost. That one mechanism caused three
separate fixes:

- #1437: the zones-sync button moved between `pointerdown` and `pointerup`
  under Firefox and the sync never started.
- #1457: a dropdown menu opened on `pointerdown` slid under a still pointer,
  and the release selected whatever item arrived there.
- #1456: the Settings section reset glided, and a press on "Add account" was
  released over another element (Mobile Safari).

Each fix worked around the glide locally. Mouse and trackpad users hit the same
race. #1377 (reduced motion) pinned the smooth default in an e2e test without
a spec requirement, so the reversal is recorded here.

## What Changes

- The stylesheet no longer sets `scroll-behavior` on `html`. The
  reduced-motion block keeps only what it still needs: no theme colour
  transition, and near-zero enter/exit animations.
- New capability `spa-motion`: programmatic scrolls jump by default, and a
  caller that wants a glide asks for it per call and honours reduced motion.
  The coach-mark highlight already does this and keeps its glide.
- `applyFocusToElement` always asks for `behavior: "instant"`. The old `auto`
  only meant a jump under reduced motion, because elsewhere it inherited the
  CSS glide. The now-unused `reduceMotion` option is removed.
- A chat search result (`ChatMessageList`) and the import dropzone input
  (`ImportDropzoneOverlay`) are scrolled into view with an explicit
  `instant`: both are jumps to something the user just asked for. The chat
  scroll is not an autoscroll to the newest message, so nothing gains from a
  glide.
- `useSectionScrollReset` drops its inline `scroll-behavior: auto` override.
  The `settings-section-scroll-jumps` e2e stays as the regression guard.
- e2e: `helpers/click-centred` is removed (plain clicks pass on every
  project). `openBlockActionsMenu` keeps its centring, which avoids the
  sticky header and bottom nav, and still forces `instant`, so the trigger is settled before the press whatever the CSS. The zones-sync
  comment no longer blames the glide. #1457's `MenuItem` primitive stays as
  defence in depth.

- A static guard, `scripts/check-no-smooth-scroll.mjs` (`R-NoGlobalSmoothScroll`,
  run by `pnpm test:scripts`), fails on `scroll-behavior: smooth` in the
  SPA's CSS, a `scrollBehavior: "smooth"` style, or the `scroll-smooth`
  utility. The e2e only reads `<html>`; the guard covers every container.

## Impact

- `spa-motion` (new), `spa-editor-focus-management` (focus-scroll scenarios),
  `spa-settings-shell` (scroll-reset wording).
- Initial JS is unchanged, and the CSS shrinks by one declaration.
