> Completed: 2026-10-15

# Proposal: route-heading focus yields to a field the user is in

## Why

After a pathname change the SPA moves focus to the page's
`[data-route-heading]`. Engines drop that focus for a while after a
navigation (headless Firefox always, Mobile Safari intermittently), so the
hook retries every 50 ms for up to 5 s. The retry never asked whether focus
had already moved on. A retry that finally landed after the user had tapped a
field took focus back, and the keystrokes typed next went to the heading.

On main this showed up as the e2e `ai-generate-workout` 8.10 failing its first
attempt on Mobile Safari (runs 38667539719 and 38769969904): the API key was
filled, the field stayed empty, and the form's submit button (then "Add
Provider", "Save account" since #1451) stayed disabled. The page snapshot at
failure had the label filled, the key empty and the heading focused.

A second Mobile Safari mechanism made the same test fail after the focus fix:
a click released over a different element than it was pressed on. Logged
pointer events showed `pointerdown` on "Add account", the page still moving,
`pointerup` 50 px further on, and the `click` dispatched to the common
ancestor, so the form never opened. Two scrolls were still gliding under
`html { scroll-behavior: smooth }`: the Settings section reset, a plain
`scrollTop = 0` the CSS animates over ~200 ms, and Playwright's own retry
scroll after the floating bottom nav intercepted the first click.

## What Changes

- The retry stops as soon as focus has moved off the element that held it
  when the route changed (usually the link just activated) to anything other
  than the body or the heading. A field the user or the page focused is
  never taken back.
- The owner is read before the new route's commit, so an element the new
  page autofocuses in that commit counts as moved-on focus, not as the stale
  owner.
- A text field that kept focus across the route change is never replaced.
- The Settings section scroll reset jumps to the top instead of gliding
  there: the write runs with the scroller's `scroll-behavior` set to `auto`.
- The e2e flows that click inside a Settings section bring the control to the
  viewport centre with an instant scroll first (`e2e/helpers/click-centred`),
  so Playwright never has to scroll it there through the smooth CSS.

## Impact

- `useFocusOnRouteChange`: a navigation with nothing else focused still
  lands on the heading, and dropped focuses are still retried.
- `useSectionScrollReset`: same reset, same triggers; only the animation is
  gone. Smooth scrolling elsewhere in the app is unchanged.
