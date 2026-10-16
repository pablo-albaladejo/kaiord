## ADDED Requirements

### Requirement: Programmatic scrolls jump by default

The SPA SHALL NOT set a smooth `scroll-behavior` on the document or on any
scroll container, so a scroll the app or the browser starts without naming a
behaviour (a route or section reset, a focus move, a `scrollIntoView`, a
fragment) jumps. A glide moves the page under a press that has already
started: the release lands on another element, the browser sends the click to
their common ancestor, and the press is lost. This applies to every user, not
only to those who ask their OS for reduced motion. A caller that wants a glide
SHALL ask for it on that call with `behavior: "smooth"`, and SHALL ask for a
jump instead under `prefers-reduced-motion: reduce`.

#### Scenario: A default-behaviour scroll lands at once

- **GIVEN** a page tall enough to scroll, with no motion preference
- **WHEN** the app calls `window.scrollTo({ top })` without a `behavior`
- **THEN** `window.scrollY` SHALL equal `top` as soon as the call returns
- **AND** the computed `scroll-behavior` of the document element SHALL be `auto`

#### Scenario: A deliberate glide honours reduced motion

- **GIVEN** the coach-mark highlight scrolling its target into view
- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** the scroll SHALL be requested without a smooth behaviour
- **AND** without the preference it MAY be requested with `behavior: "smooth"`

### Requirement: Reduced motion removes theme and enter/exit animation

Under `prefers-reduced-motion: reduce` the document SHALL NOT transition its
background or text colour when the theme changes, and enter/exit animations
SHALL shorten to a near-zero duration rather than be removed, so components
waiting for `animationend` still unmount. Without the preference the theme
change SHALL keep its colour transition.

#### Scenario: Theme transitions follow the preference

- **WHEN** the app loads with `prefers-reduced-motion: reduce`
- **THEN** neither the document element nor the body SHALL report a colour transition
- **AND** with no motion preference both SHALL report one
