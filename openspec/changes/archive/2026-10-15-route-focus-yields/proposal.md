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
filled, the field stayed empty, and "Add Provider" stayed disabled. The page
snapshot at failure had the label filled, the key empty and the heading
focused.

## What Changes

- The retry stops as soon as focus has moved off the element that held it
  when the route changed (usually the link just activated) to anything other
  than the body or the heading. A field the user or the page focused is
  never taken back.

## Impact

- `useFocusOnRouteChange` only. A navigation with nothing else focused still
  lands on the heading, and dropped focuses are still retried.
