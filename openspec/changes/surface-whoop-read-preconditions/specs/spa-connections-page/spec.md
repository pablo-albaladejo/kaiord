## ADDED Requirements

<!-- DEPENDS ON the `spa-connections-page` capability, which does not exist
     under openspec/specs/ yet: it is created by `retire-legacy-connection-
     surfaces` (PR #1089), in review at the time of writing. This delta is
     written against it deliberately rather than inventing a second home for
     the requirement, and it must be archived after that change. -->

### Requirement: A card that names a problem offers the surface that resolves it

A source card that reports a problem the user can resolve SHALL link to the
surface where they resolve it, beside the sentence that names the problem
rather than in place of it — a link without the diagnosis is a click with no
reason attached.

The link SHALL be offered ONLY where the provider's own site is where the fix
happens. That is the `attention` state alone: a disconnected source is
re-linked by the card's own control, and a missing browser extension is not
installed from the provider's site at all, so offering the link there would
send the user somewhere that cannot help them.

A destination SHALL be a plain, account-independent URL — nothing composed
from an identifier, a tenant or a profile — so no card can resolve to a
stranger's page or to a route that does not exist. A source whose destination
is not established SHALL render no link at all: a wrong destination is worse
than none, because it looks like a fix. Destinations SHALL agree with the ones
the corresponding browser extension's own popup already uses, so the two
surfaces cannot send the same user to two different places.

Links SHALL open in a new tab without handing the opener a navigable window
handle.

#### Scenario: A signed-out source offers its sign-in page

- **GIVEN** a source whose card reports that its session is signed out
- **WHEN** the card renders
- **THEN** it SHALL offer a link to that provider's own sign-in surface
- **AND** the sentence naming the problem SHALL still be present

#### Scenario: A missing extension is not sent to the provider's site

- **GIVEN** a source whose browser extension is not running
- **WHEN** the card renders
- **THEN** it SHALL offer no link to the provider's site, because signing in there would not install the extension

#### Scenario: A healthy source offers no fix

- **GIVEN** a source that is connected and reading
- **WHEN** the card renders
- **THEN** no fix link SHALL be rendered

#### Scenario: An unestablished destination renders nothing

- **GIVEN** a source in the attention state for which no destination has been established
- **WHEN** the card renders
- **THEN** no link SHALL be rendered, and no other source's destination SHALL be substituted
