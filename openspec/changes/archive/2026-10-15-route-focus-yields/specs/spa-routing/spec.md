## ADDED Requirements

### Requirement: Route-heading focus yields to a later focus

The route-change focus move SHALL NOT take focus back from an element that received focus after the pathname changed. While the engine drops the heading focus the SPA MAY retry it, but every retry SHALL first check where focus is. If focus has moved off the element that held it when the route changed, to anything other than the document body or the heading, the retry SHALL stop and leave focus where it is. The element that held focus is the one focused before the new route's commit, so an element the new page autofocuses in that commit SHALL keep focus, and a text field that kept focus across the route change SHALL NOT be replaced.

#### Scenario: A field focused during a dropped-focus window keeps focus

- **WHEN** the pathname changes, the engine drops the heading focus, and the user focuses a text field before a retry lands
- **THEN** focus SHALL stay in the field, and every character the user types next SHALL reach it

#### Scenario: A field the new page autofocuses keeps focus

- **WHEN** the pathname changes and the new page autofocuses one of its fields in the same commit
- **THEN** focus SHALL stay in that field and SHALL NOT move to the heading

#### Scenario: A navigation with nothing else focused still lands on the heading

- **WHEN** the pathname changes and nothing receives focus afterwards
- **THEN** focus SHALL move to the new page's `[data-route-heading]` element, retrying while the engine drops it
