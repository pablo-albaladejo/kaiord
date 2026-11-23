## MODIFIED Requirements

### Requirement: A card claims only what a live signal supports

The system SHALL NOT render a status, a count or a consequence that no live
signal can produce. Where a distinction cannot be observed, the weaker true
statement SHALL be rendered rather than the stronger plausible one.

Specifically: a source whose extension is present but which is never
session-probed SHALL be described as installed, never as connected and never as
being checked. A source whose probe came back without a usable read SHALL be
described by the Connection notice of its verified state (`connection-notices`),
with that notice's one fix: Try again when the check could not tell why,
Sign in to the Platform only when the Platform itself refused the sign-in, and
Update for an extension on another protocol version. It SHALL NOT be described
as signed out and SHALL NOT claim that a credential expired: Garmin mints its
bearer from a long-lived OAuth1 token, so its reads survive the user signing
out of the Garmin website and a failed read is no evidence about their
session. A card whose extension is not installed SHALL show the Install notice
once discovery has had its window, and no page-wide banner SHALL repeat it. No card
SHALL claim when a source stopped working, because no transition timestamp is
recorded; freshness SHALL be expressed as when data was last received, or as
having received none.

#### Scenario: A source with no session probe

- **GIVEN** a discovered source that the system never probes for a session, because probing it would download the user's whole export
- **WHEN** its card renders
- **THEN** it SHALL be described as detected when the page loaded, and SHALL NOT be described as connected or as being checked
- **AND** it SHALL state that its presence cannot be re-checked and that it may have been removed since

#### Scenario: Probe-less is a property of the source, not a shape its state reaches

- **GIVEN** a source that IS session-probed but whose probe has not recorded an answer yet
- **WHEN** its card renders
- **THEN** it SHALL be described as being checked, and SHALL NOT borrow the copy that belongs to a source the system never probes

#### Scenario: A probe in flight is distinguishable from one that never runs

- **GIVEN** a source whose session probe is in flight
- **WHEN** its card renders
- **THEN** it SHALL be described as being checked, not as installed

#### Scenario: A probe that came back without a usable read

- **GIVEN** a discovered source whose last probe came back without a usable read
- **WHEN** its card renders
- **THEN** it SHALL show "<Platform> is not answering" with Try again, which re-runs the check, and no copy SHALL assert that a credential expired or that the session is signed out

#### Scenario: Freshness without a transition timestamp

- **GIVEN** a connected source that has never delivered data
- **WHEN** its card renders
- **THEN** it SHALL say that no data has been received, and SHALL NOT state when delivery stopped

### Requirement: A broken source states its consequence, and only what is recorded

When one or more sources need attention the section SHALL state, above the
cards, what broke and what stopped arriving because of it. When no source needs
attention it SHALL render nothing at all — no container and no placeholder.

The consequence SHALL name the data types that lost every delivering source:
types with an enabled route on an affected source and no other present source
serving them. Where the affected sources' types are all still served elsewhere,
the statement SHALL say that nothing stopped; where an affected source feeds no
switched-on route at all, it SHALL say that instead. Both are reachable states
and neither SHALL be reported as a loss.

A type that can also be entered by hand SHALL still be named when its automatic
delivery stops. Manual entry is a path the reader must walk deliberately, so it
does not make a stopped source unremarkable.

The statement SHALL NOT name a source that has taken over for the affected one.
The default multi-source mode returns every source's record with no ranked
winner, so no source ever succeeds another, and a named successor would be an
invention.

The statement SHALL NOT claim a credential expired, and SHALL NOT state how
long a source has been broken or when it broke. No transition timestamp is
recorded anywhere, and the time of the last probe is not one: after a reload it
reads as moments ago however long a source has been down. A date SHALL be
attached only from a recorded last delivery, only when exactly one source is
affected, and only in the reader's own calendar day.

A date SHALL be attached ONLY to a statement that names a loss. It qualifies
one, so appending it to either statement that nothing stopped arriving would
contradict the sentence it is joined to — and that combination is ordinary
rather than exotic, since an affected source whose types another source still
covers has a recorded last delivery like any other. This precedence is
required: the two rules are otherwise simultaneously satisfiable.

A cause SHALL be named only when it holds for every affected source. With
several affected, only the count holds for all of them; in particular one
extension speaking an unsupported protocol version does not make the others
out of date.

A lone affected source's title SHALL be its own Connection notice
(`connection-notices`), so an extension speaking an unsupported protocol
version is told to update rather than to sign in, and a check that could not
tell why says the Platform is not answering.

The statement SHALL declare no call to action while the fix is a sign-in on the
provider's own site, which this page cannot perform.

#### Scenario: A healthy section states no consequence

- **GIVEN** no source needs attention
- **WHEN** the section renders
- **THEN** no consequence SHALL be rendered

#### Scenario: The types that lost their source are named

- **GIVEN** an affected source serving types no other present source serves
- **WHEN** the consequence is stated
- **THEN** it SHALL name those types, and SHALL NOT name a source that took over from the affected one

#### Scenario: A type served elsewhere is not reported as lost

- **GIVEN** an affected source whose types are all also served by a present source
- **WHEN** the consequence is stated
- **THEN** it SHALL state that nothing stopped arriving

#### Scenario: A source feeding no route reports no loss

- **GIVEN** an affected source with no switched-on route
- **WHEN** the consequence is stated
- **THEN** it SHALL state that nothing stopped arriving rather than naming a type

#### Scenario: A failed read is stated without naming its cause

- **GIVEN** exactly one affected source whose probe came back without a usable read
- **WHEN** the consequence is stated
- **THEN** it SHALL state that the Platform is not answering, and SHALL NOT claim a credential expired or that the source is signed out

#### Scenario: The date comes from the last delivery

- **GIVEN** exactly one affected source with a recorded last delivery
- **WHEN** the consequence is stated
- **THEN** it SHALL state that no new data has arrived since that date, in the reader's own calendar day, and SHALL NOT state how long the source has been broken

#### Scenario: Several affected sources carry no date

- **GIVEN** more than one affected source, at least one with a recorded last delivery
- **WHEN** the consequence is stated
- **THEN** no date SHALL be stated

#### Scenario: A statement that nothing stopped carries no date

- **GIVEN** exactly one affected source with a recorded last delivery, whose types are all still served by a present source
- **WHEN** the consequence is stated
- **THEN** it SHALL state that nothing stopped arriving and SHALL NOT state a date

#### Scenario: An outdated extension is told to update

- **GIVEN** exactly one affected source whose probe answered with an unsupported protocol version
- **WHEN** the consequence is stated
- **THEN** it SHALL show the Update notice naming "Kaiord for <Platform>", and SHALL NOT tell the reader to sign in

#### Scenario: A cause held by one of several is not generalised

- **GIVEN** two affected sources of which only one answered with an unsupported protocol version
- **WHEN** the consequence is stated
- **THEN** it SHALL state the count alone, and SHALL NOT describe either source's cause
