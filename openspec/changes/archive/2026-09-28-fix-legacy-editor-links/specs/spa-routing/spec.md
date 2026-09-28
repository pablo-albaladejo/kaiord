## MODIFIED Requirements

### Requirement: Legacy path URLs bridge into the fragment form

URLs that carry the route in the path (`/editor/<route>`, and the narrow root-level allowlist) SHALL continue to reach the corresponding route, for as long as the site exists.

The bridge is deliberately open-ended rather than a deprecation window. Five published Chrome extensions carry `https://kaiord.com/editor/` in their popups, and their store updates are gated on a review outside this project's control; a bridge with a sunset would break them on a date nobody here chooses. Such URLs are served by the host's `404.html`, so they still cost one error response — what the change removes is the app ever _producing_ one. The one exception is the bare `/editor/` URL, which a crawler would otherwise score as a dead page: it SHALL be a real page (`editor/index.html`, written by `scripts/emit-legacy-editor-page.mjs` after the bridge is injected) that answers 200, carries `rel="canonical"` to `https://kaiord.com/app/` and no `noindex`, and runs the same redirect expression as the bridge. A differential test SHALL run both scripts over one URL table and require identical targets.

The redirect script SHALL be injected into `<head>`, before any visible markup, so a legacy URL never paints an error page before it moves. `scripts/inject-spa-fallback.mjs` SHALL verify the snippet's **position**, not merely its presence: the appended-at-end placement is the state that produced a visible error page on every deep link while the presence check passed.

#### Scenario: A legacy path URL lands on the right route

- **WHEN** `/editor/calendar/2026-W32` is requested cold
- **THEN** the user SHALL end on the corresponding fragment route with the calendar week rendered

#### Scenario: The injector rejects an appended snippet

- **WHEN** the redirect snippet is appended after the document's visible markup instead of injected into `<head>`
- **THEN** `inject-spa-fallback` SHALL fail, naming the position rather than reporting the snippet as present

#### Scenario: The bare legacy prefix is a 200 page that keeps the query

- **WHEN** `/editor/?utm_source=t` is requested
- **THEN** the response status SHALL be 200, with `rel="canonical"` to `https://kaiord.com/app/` and no `noindex`
- **AND** a client running JavaScript SHALL land on `/app/#/?utm_source=t`, the same target the `404.html` bridge computes
- **AND** a client without JavaScript SHALL land on `/app/` through the meta refresh, without the query string, because static HTML cannot append it
