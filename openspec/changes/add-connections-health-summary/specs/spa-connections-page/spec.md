## ADDED Requirements

<!-- ADDED to the capability introduced by the ACTIVE sibling change
add-connections-page. That capability is not published under openspec/specs/
yet, so its current text lives in that change's delta; nothing there is
modified here. -->

### Requirement: The section answers its own headline questions before the cards

The Connections section SHALL open with a small set of counters answering,
without reading any card, how many sources are present, how much of what the
product manages has a source, how many sources need attention, and when data
last arrived.

Every counter SHALL be derived from the same per-source state the section
renders its cards from. No counter SHALL carry its own predicate for a
question a card already answers: a summary that can disagree with the surface
beneath it is worse than no summary.

A counter SHALL NOT state a denominator it cannot reach. In particular the
count of present sources SHALL count detected extensions rather than live
sessions, because at least one bridge is never session-probed and a session
count could therefore never equal its own total — a counter fixed one short of
completion reads as a defect rather than as a state.

#### Scenario: The counters agree with the cards

- **GIVEN** a set of sources of which some number are marked as needing attention
- **WHEN** the counters render
- **THEN** the attention counter SHALL equal that number

#### Scenario: The present-source count reaches its denominator

- **GIVEN** every known bridge is detected, including one that is never session-probed
- **WHEN** the counters render
- **THEN** the present-source counter SHALL equal its own total

#### Scenario: Sources with no extension are outside the count

- **GIVEN** the section also renders manual entry and brands that cannot be connected
- **WHEN** the present-source counter is derived
- **THEN** neither its count nor its total SHALL include them

#### Scenario: Freshness comes from delivered data, not from the last check

- **GIVEN** several sources with recorded last-delivery times
- **WHEN** the freshness counter renders
- **THEN** it SHALL report the most recent delivery and the source that made it, and SHALL NOT report when a source was last probed

#### Scenario: An unusable delivery time is ignored

- **GIVEN** a source whose recorded last-delivery value does not parse as a date
- **WHEN** the freshness counter is derived
- **THEN** that source SHALL be skipped rather than rendered as an invalid value

### Requirement: The counters claim nothing until the connection store has answered

The counters SHALL render a placeholder, distinct from zero, until the
connection store has completed a refresh pass. Every bridge row exists from the
first render and reads undetected until then — because nothing has been asked
yet, not because nothing is there — so a count rendered from that state would
be wrong rather than merely early, and would tell a fully equipped reader that
none of their sources are present on every cold load.

#### Scenario: A cold load counts nothing

- **GIVEN** the connection store has not completed a refresh pass
- **WHEN** the counters render
- **THEN** they SHALL render a placeholder and SHALL NOT render a count

#### Scenario: The counters appear once the store has answered

- **GIVEN** the connection store has completed a refresh pass
- **WHEN** the counters render
- **THEN** they SHALL render counts derived from the resolved sources

### Requirement: Coverage is counted over having a source, not over data in flight

A managed data type SHALL be counted as covered when an enabled import route
exists for it whose source is present, or when the type has a real manual-entry
path in the product. The counter's wording SHALL describe having a source
rather than data arriving, because manual entry is a path the reader has to
walk themselves.

Manual entry SHALL be included. At least one managed type has no bridge
capability token announced by any bridge and can therefore only ever be entered
by hand; excluding manual entry would put the counter's denominator permanently
out of reach.

A route SHALL be counted only while it is switched on. Every importer gates on
an enabled route before contacting a bridge, so a switched-off route delivers
nothing however healthy its source is.

A type SHALL remain counted while its source is being probed. A probe is in
flight for a moment on every poll, and dropping the type for that window would
make the counter change while nothing about the reader's setup did.

#### Scenario: A live route covers its type

- **GIVEN** an enabled import route for a type whose source is present
- **WHEN** coverage is derived
- **THEN** that type SHALL be counted as covered

#### Scenario: A switched-off route covers nothing

- **GIVEN** an import route that exists but is switched off
- **WHEN** coverage is derived
- **THEN** its type SHALL NOT be counted as covered

#### Scenario: A hand-entered type is covered with no extension at all

- **GIVEN** no source is present and no route is switched on
- **WHEN** coverage is derived
- **THEN** every type with a manual-entry path SHALL still be counted as covered

#### Scenario: A type with no path at all is not covered

- **GIVEN** a type with no manual-entry path and no enabled route
- **WHEN** coverage is derived
- **THEN** it SHALL NOT be counted as covered

#### Scenario: A probe in flight does not uncover a type

- **GIVEN** an enabled route whose source is currently being probed
- **WHEN** coverage is derived
- **THEN** its type SHALL remain counted as covered

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

A cause SHALL be named only when it holds for every affected source. With
several affected, only the count holds for all of them; in particular one
extension speaking an unsupported protocol version does not make the others
out of date.

An extension speaking an unsupported protocol version SHALL be reported as out
of date rather than as signed out, because the probe succeeded and signing in
again would fix nothing.

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

#### Scenario: A session problem is described as signed out

- **GIVEN** exactly one affected source whose probe reports no usable session
- **WHEN** the consequence is stated
- **THEN** it SHALL describe the source as signed out, and SHALL NOT claim a credential expired

#### Scenario: The date comes from the last delivery

- **GIVEN** exactly one affected source with a recorded last delivery
- **WHEN** the consequence is stated
- **THEN** it SHALL state that no new data has arrived since that date, in the reader's own calendar day, and SHALL NOT state how long the source has been broken

#### Scenario: Several affected sources carry no date

- **GIVEN** more than one affected source, at least one with a recorded last delivery
- **WHEN** the consequence is stated
- **THEN** no date SHALL be stated

#### Scenario: An outdated extension is told to update

- **GIVEN** exactly one affected source whose probe answered with an unsupported protocol version
- **WHEN** the consequence is stated
- **THEN** it SHALL say the extension is out of date, and SHALL NOT tell the reader to sign in

#### Scenario: A cause held by one of several is not generalised

- **GIVEN** two affected sources of which only one answered with an unsupported protocol version
- **WHEN** the consequence is stated
- **THEN** it SHALL state the count alone, and SHALL NOT describe either source's cause

### Requirement: One refresh covers every bridge and cannot be held down

The section SHALL offer a single refresh that re-checks every known bridge, not
a subset, and SHALL survive an unreachable bridge without abandoning the rest
of the pass.

The refresh SHALL be rate-limited on the client. It forces a pass, which
deliberately bypasses the store's positive cache, and the floor that limits
automatic forced passes lives outside the store; status probes also run outside
the operation queue, so nothing downstream provides backpressure. The window
SHALL be no shorter than the floor already applied to automatic forced passes,
so pressing the control can never be more aggressive than the product already
is on its own.

A press inside that window SHALL be refused visibly rather than silently, and a
press while a pass is already running SHALL join that pass rather than start a
second. The window SHALL be applied after a failed pass as well as a successful
one, so a failing bridge cannot be retried in a tight loop.

A bridge that is never session-probed SHALL be reported as present through a
refresh, and SHALL NOT be shown as being checked. Nothing will ever answer for
it, so a pending state would never resolve.

#### Scenario: The refresh reaches every bridge

- **WHEN** the refresh runs
- **THEN** every known bridge SHALL be re-checked

#### Scenario: A repeated press inside the window is refused visibly

- **GIVEN** a refresh completed within the rate-limit window
- **WHEN** the control is pressed again
- **THEN** no pass SHALL start and the refusal SHALL be stated to the reader

#### Scenario: A second press joins the running pass

- **GIVEN** a refresh already in flight
- **WHEN** the control is pressed again
- **THEN** no second pass SHALL start

#### Scenario: A failed pass still takes the window

- **GIVEN** a refresh pass that failed
- **WHEN** the control is pressed again inside the window
- **THEN** no pass SHALL start

#### Scenario: An unprobed bridge never shows as being checked

- **GIVEN** a bridge with no session prober
- **WHEN** a refresh completes
- **THEN** it SHALL be reported as present and SHALL NOT be reported as being checked
