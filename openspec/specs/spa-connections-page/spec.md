> Synced: 2026-07-29 (retire-legacy-connection-surfaces)

# SPA Connections Page

## Purpose

The single surface — `/settings/connections` — that answers whether Kaiord is
receiving a user's data and where each managed data type is read from. Defines
one rule for whether a source is connected, what a source card may claim, how
the thirteen data-type rows name their source of truth and let it be changed,
what the health counters and the consequence banner are allowed to assert, and
that the three surfaces it replaced resolve to it. Every claim on the page is
derived from a live signal; nothing here may state what no state can support.

## Requirements

### Requirement: One rule decides whether a source is connected

The system SHALL derive a source's connected state from a single rule, applied
identically everywhere that state is displayed. For a browser-bridge source the
rule SHALL be that its extension is discovered AND its stored connection record
does not say disconnected; an absent record SHALL be read as "never
disconnected" rather than as "not connected". For a credential-based source the
rule SHALL remain that a stored record says connected. Manual entry links no
account and SHALL therefore answer the rule negatively, being described from its
mechanism rather than from a connection state.

No surface SHALL apply a different rule to the same source. In particular, a
routing surface's column heading and the cells beneath it SHALL agree, so a
source can never be described as not connected above data it is shown to be
delivering.

#### Scenario: A bridge nobody disconnected is connected once discovered

- **GIVEN** a bridge whose extension is discovered and for which no connection record exists
- **WHEN** its state is derived
- **THEN** it SHALL be connected

#### Scenario: A disconnect takes effect

- **GIVEN** a bridge whose extension is discovered and whose stored record says disconnected
- **WHEN** its state is derived
- **THEN** it SHALL NOT be connected

#### Scenario: A stored record cannot substitute for a missing extension

- **GIVEN** a bridge whose extension is not discovered
- **WHEN** its state is derived
- **THEN** it SHALL NOT be connected, whatever its stored record says

#### Scenario: Heading and cells agree

- **GIVEN** a routing surface showing both a per-source heading and per-route cells
- **WHEN** a bridge is connected under the rule
- **THEN** its heading and its cells SHALL both reflect that, and neither SHALL be derived from a signal the other ignores

### Requirement: The Connections section presents one card per source

The system SHALL present every known integration as a card in a single section,
ordered by what the user can act on: sources that are working first, then those
needing a decision, then those that are absent, then sources that are always on,
then brands with no connect mechanism. Each card SHALL be addressable by a
stable identifier derived from the source, and SHALL expose its derived state as
data rather than only as prose, so no test or assistive consumer has to match
display copy.

A browser bridge SHALL be reported inside its source's card rather than as a
separate list of extensions: an extension is only meaningful as the reason a
source can or cannot deliver.

#### Scenario: Working sources come first

- **GIVEN** one connected source and one absent source
- **WHEN** the section renders
- **THEN** the connected source's card SHALL appear before the absent one's

#### Scenario: Cards are addressable

- **WHEN** any card renders
- **THEN** it SHALL carry a stable per-source test identifier and expose its derived status as an attribute

#### Scenario: The bridge lives in the card

- **GIVEN** a bridge-backed source
- **WHEN** its card renders
- **THEN** the card SHALL state whether that source's browser bridge was detected

### Requirement: A card claims only what a live signal supports

The system SHALL NOT render a status, a count or a consequence that no live
signal can produce. Where a distinction cannot be observed, the weaker true
statement SHALL be rendered rather than the stronger plausible one.

Specifically: a source whose extension is present but which is never
session-probed SHALL be described as installed, never as connected and never as
being checked. A source whose probe came back without a usable read SHALL be
described as one Kaiord cannot read from, and SHALL NOT be described as signed
out and SHALL NOT claim that a credential expired. Neither cause is observable:
every probe folds a provider outage into the same answer as a dead credential,
and one bridge makes the sign-out reading outright false — Garmin mints its
bearer from a long-lived OAuth1 token in extension storage rather than from a
cookie, so its reads survive the user signing out of the Garmin website and a
failed read is no evidence about their session. The copy SHALL therefore name
both possibilities and assert neither, and SHALL keep offering a sign-in as the
action, which genuinely re-mints access where access is what lapsed. No card
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
- **THEN** it SHALL state that Kaiord could not read from that source, and no copy SHALL assert that a credential expired or that the session is signed out
- **AND** it SHALL name a provider outage as a possible cause alongside lapsed access, and SHALL still offer signing in again as the action

#### Scenario: Freshness without a transition timestamp

- **GIVEN** a connected source that has never delivered data
- **WHEN** its card renders
- **THEN** it SHALL say that no data has been received, and SHALL NOT state when delivery stopped

### Requirement: Capability chips describe routes the product actually serves

The system SHALL derive what a source sends and receives from the intersection
of the capability its extension announces and the routes the application
actually implements for that source. A capability announced by an extension for
which no route is implemented SHALL NOT be presented as something the product
does.

A source whose extension is not present has announced nothing. Its card SHALL
NOT present capability counts, and where its routes would otherwise be listed
the system SHALL say they are unknown until the extension is running — which is
a different statement from saying there are none.

#### Scenario: An announced capability with no implementation

- **GIVEN** a source whose extension announces a write capability for which the application implements no route
- **WHEN** its card renders
- **THEN** no chip or list SHALL indicate that the product sends data to it

#### Scenario: A shared capability token is narrowed

- **GIVEN** a source announcing a capability token that spans several data types but which serves only some of them
- **WHEN** its routes are derived
- **THEN** only the served types SHALL be listed

#### Scenario: Unknown is not the same as none

- **GIVEN** a source whose extension is not detected
- **WHEN** its card is expanded
- **THEN** its routes SHALL be reported as unknown until the extension is running, and no capability chip SHALL be shown

### Requirement: Controls are offered only where they can act

The system SHALL render a control only where invoking it changes something. A
source that the user disconnected and whose extension is still present SHALL
offer a way to re-link it, and that action SHALL write the connection record
that reverses the disconnect. A source whose extension is absent SHALL NOT offer
a connect control, because a web page cannot install a browser extension; it
SHALL explain what to do instead. A brand with no connect mechanism SHALL be
listed without any control, including without a way to register interest, since
nothing records one.

#### Scenario: Re-linking a disconnected source

- **GIVEN** a source with a stored disconnected record whose extension is present
- **WHEN** its card renders
- **THEN** a re-link control SHALL be offered, and invoking it SHALL clear the disconnected state

#### Scenario: No control for an absent extension

- **GIVEN** a source whose extension is not detected
- **WHEN** its card renders
- **THEN** no connect control SHALL be offered, and the card SHALL state that the extension is not running

#### Scenario: Unsupported brands carry no control

- **GIVEN** a brand with no connect mechanism
- **WHEN** it is listed
- **THEN** no control SHALL be rendered for it, including no interest-registration control

### Requirement: A source can be asked to sync, where a sync exists

The system SHALL let the user trigger an import for a source on demand, using
the same import path the automatic import uses, so a manual and an automatic
import cannot diverge in what they fetch or how they deduplicate. A source whose
import cannot be expressed without context the section does not have SHALL NOT
offer the control at all, rather than offer one with an invented scope.

Because these imports bypass the protocol's operation queue and at least one of
them transfers a full export per call, the system SHALL prevent a second import
for the same source while one is running, and SHALL refuse a further import for
a cooldown period after one completes. A refusal SHALL be reported to the user
rather than silently ignored.

#### Scenario: A manual import uses the automatic path

- **GIVEN** a source with an on-demand import
- **WHEN** the user triggers it
- **THEN** the same import routine the automatic import uses SHALL run for that source

#### Scenario: A week-scoped import offers no control

- **GIVEN** a source whose import is scoped to a calendar week
- **WHEN** its card renders in a section that has no week
- **THEN** no sync control SHALL be offered for it

#### Scenario: Repeated presses are throttled

- **GIVEN** a source whose import has just completed
- **WHEN** the user triggers it again within the cooldown period
- **THEN** no import SHALL run, and the user SHALL be told why

#### Scenario: The guard outlives the control that renders it

- **GIVEN** a source whose import is still running
- **WHEN** the surface holding the control is dismissed and re-shown, and the import is triggered again
- **THEN** no second import SHALL start, and the re-shown control SHALL report the running import and settle with its outcome

#### Scenario: A failed import releases the control

- **GIVEN** a source whose import fails
- **WHEN** the failure is observed
- **THEN** the failure SHALL be reported and the control SHALL become usable again

### Requirement: Connection polling runs when a surface consumes it

The system SHALL start the bridge connection store for the lifetime of the
application session, not for the lifetime of the page that displays it, so that
the store's positive cache and polling cadence survive navigation instead of
being restarted — and every bridge re-probed — each time the section is opened.

#### Scenario: The store polls once per session

- **WHEN** the application hydrates its stores
- **THEN** the bridge connection store SHALL be started exactly once, and stopped when the application unmounts

#### Scenario: Opening the section does not re-probe

- **GIVEN** the connection store is already running
- **WHEN** the Connections section is opened
- **THEN** opening it SHALL NOT itself restart polling

### Requirement: The section's copy is fully translated and mechanically complete

Every string the Connections section renders SHALL come from the locale
catalogs, in every supported locale. Where the section names managed data types,
the system SHALL enforce mechanically that every managed type has a name in
every locale, so introducing a new managed type cannot silently render an
internal identifier to the user. Quantities SHALL be expressed with per-count
forms rather than one interpolated template, since the catalogs carry no plural
machinery.

#### Scenario: Every managed data type is named

- **WHEN** the data-type names are checked against the managed-type registry
- **THEN** every managed type SHALL have a name in every supported locale, and no locale SHALL name a type that is not in the registry

#### Scenario: A single item is not described in the plural

- **GIVEN** a source serving exactly one data type in a direction
- **WHEN** its chip renders
- **THEN** the wording SHALL be the singular form

### Requirement: A source is reported present only while there is evidence it is

The system SHALL NOT report a source as present on the strength of a past
announcement alone. Bridge discovery records an extension the first time it
announces itself and never expires that record, so presence SHALL be re-derived
from live evidence: where a source is contacted at all, a delivery failure
SHALL mean the extension is gone and the source SHALL be reported as not
connected.

A delivery failure and a refusal SHALL be distinguished. An extension that
answers and reports no usable upstream session is present; only a message that
never reached the extension means it is absent. The two SHALL NOT share copy,
because signing in cannot fix a removed extension.

Where a source cannot be contacted at all — because the only action it exposes
is prohibitively expensive — the system SHALL NOT claim present-tense presence
for it, and SHALL word its state as what was observed and when.

#### Scenario: An uninstalled extension stops being reported as present

- **GIVEN** a source that was discovered earlier in the session
- **WHEN** contacting it fails to reach the extension
- **THEN** the source SHALL be reported as not connected, and no re-link control SHALL be offered for it

#### Scenario: A signed-out extension is still present

- **GIVEN** a source whose extension answers and reports no usable upstream session
- **WHEN** its state is derived
- **THEN** it SHALL remain reported as present, and its state SHALL be the signed-out one rather than the absent one

#### Scenario: An uncontactable source does not claim the present tense

- **GIVEN** a source the system cannot contact cheaply enough to poll
- **WHEN** its card renders
- **THEN** its wording SHALL be limited to what was observed and when, and SHALL admit that the source may have been removed since

### Requirement: A ranked source policy is never stored without its ranking

A ranked multi-source mode is meaningless without an order: the read resolver
consults the stored order and, finding nothing usable in it, resolves no record
at all, while every display surface is left to invent a winner. The system SHALL
persist a ranked policy only when EVERY source named in the request resolves to
a storage key, and SHALL otherwise report the refusal, naming the sources it
could not resolve, without writing anything.

Discarding the unresolvable names and storing the rest SHALL NOT be treated as
success: dropping a leading name promotes a source the request ranked BELOW it,
which the resolver then honours and every display surface then reports, so a
partial failure would silently invert the user's stated preference while
appearing to have worked.

#### Scenario: An order that resolves to nothing is refused

- **GIVEN** a request to set a ranked source policy naming only sources that do not resolve to a storage key
- **WHEN** the request is applied
- **THEN** no policy SHALL be persisted
- **AND** the caller SHALL be told the order could not be resolved

#### Scenario: A partially resolvable order is refused too

- **GIVEN** a request to set a ranked source policy whose first source does not resolve and whose second does
- **WHEN** the request is applied
- **THEN** no policy SHALL be persisted
- **AND** the second source SHALL NOT become the ranked first

#### Scenario: A fully resolvable order is stored

- **GIVEN** a request to set a ranked source policy in which every named source resolves
- **WHEN** the request is applied
- **THEN** the policy SHALL be persisted in the order requested

### Requirement: The section names where every managed data type comes from

The system SHALL present every managed data type as a row in one section beneath
the source cards, and SHALL derive the set of rows from the domain's own list of
managed types rather than from a hand-kept copy. Rows SHALL be presented in
named groups, and every managed type SHALL belong to exactly one group, so a
type added to the domain cannot render in no group at all.

Each row SHALL be addressable by a stable identifier derived from its data type,
and SHALL expose its derived origin as data rather than only as prose.

#### Scenario: Every managed type is rendered

- **WHEN** the section renders
- **THEN** every data type the domain manages SHALL appear exactly once

#### Scenario: A type the grouping does not cover fails loudly

- **GIVEN** a data type present in the domain's managed list and absent from every group
- **WHEN** the grouping is checked
- **THEN** the check SHALL fail rather than the type being omitted from the page

### Requirement: A source is named only when one source is real

The system SHALL derive a row's origin from the profile's enabled import routes
for that type, together with manual entry for the types that have a manual entry
path. With no source it SHALL say so. With exactly one source it SHALL name that
source.

The stored multi-source mode SHALL be consulted whatever the number of sources,
including one: a ranked order that excludes the lone available source makes the
resolver read nothing, so naming that source would attribute the type to data
that never surfaces. Under a ranked mode the system SHALL name the first source
of the effective order — the same one the read resolver consults — so the two
cannot disagree. Under the default unranked mode every source keeps writing and
nothing ranks them, so with two or more sources the system SHALL report HOW MANY
there are and SHALL NOT name one; naming one would present the order records
happened to be written in as a choice the user made.

#### Scenario: A type with no manual path and no route has no source

- **GIVEN** a data type with no enabled import route and no manual entry path
- **WHEN** its origin is derived
- **THEN** it SHALL report that it has no source

#### Scenario: Manual entry counts as a source

- **GIVEN** a data type with a manual entry path and no enabled import route
- **WHEN** its origin is derived
- **THEN** manual entry SHALL be named as its source

#### Scenario: The default unranked mode reports a count

- **GIVEN** a data type with two or more sources and no stored ranking
- **WHEN** its origin is derived
- **THEN** the row SHALL state how many sources it has
- **AND** SHALL NOT name any one of them

#### Scenario: A stored ranking is honoured

- **GIVEN** a data type with two or more sources and a stored ranked order
- **WHEN** its origin is derived
- **THEN** the row SHALL name the first source of that order

#### Scenario: A ranked mode that ranks nothing names nothing

- **GIVEN** a data type in a ranked mode whose stored order names none of its currently available sources
- **WHEN** its origin is derived
- **THEN** the row SHALL report that it has no usable source
- **AND** SHALL NOT fall back to whichever source happens to be first

#### Scenario: A ranked order that excludes the only source

- **GIVEN** a data type with exactly one available source and a stored ranked order that does not include it
- **WHEN** its origin is derived
- **THEN** the row SHALL report that it has no usable source rather than naming that source

### Requirement: A row whose ranking cannot be honoured says so

Where a ranked order names none of the currently available sources the resolver
returns no record for that type at all — the data is not merely unranked, it is
not being read. The system SHALL distinguish this from the unranked default in
both its wording and its visual treatment, and SHALL NOT describe it with copy
that implies the sources are being kept side by side. This is the one state on
this read-only surface permitted to present itself as a problem.

#### Scenario: The stalled state is not described as healthy redundancy

- **GIVEN** a data type whose ranked order names no available source
- **WHEN** its row renders
- **THEN** the row SHALL state that nothing is being read for the type
- **AND** SHALL NOT reuse the wording given to a type whose sources are all kept

#### Scenario: A route the user switched off is not a source

- **GIVEN** an import route that exists but is disabled
- **WHEN** the origin is derived
- **THEN** that route's source SHALL NOT be counted

### Requirement: Freshness is attributed to the source, never to the data type

Stored sync freshness is recorded per (source, profile) and carries no data type.
The system SHALL therefore state freshness with the SOURCE as its subject, and
SHALL make it plain that the time describes everything that source sends rather
than the row it appears on. The system SHALL NOT claim that a particular data
type arrived at a particular time.

Where no single source owns a row, the system SHALL show no time rather than
choosing one of several arbitrarily. Where a source has recorded no sync at all —
including manual entry, which records none by design — the system SHALL show no
time rather than inventing one.

#### Scenario: The time names its source

- **GIVEN** a row whose single source has a recorded sync time
- **WHEN** the row renders
- **THEN** the sentence SHALL name that source as the subject of the time

#### Scenario: No owning source, no time

- **GIVEN** a row reporting a count of sources rather than a name
- **WHEN** the row renders
- **THEN** no sync time SHALL be shown

#### Scenario: A source that has never synced shows no time

- **GIVEN** a row whose source has no recorded sync
- **WHEN** the row renders
- **THEN** no sync time SHALL be shown

### Requirement: An export target is offered only where an export can exist

The system SHALL offer a row's "sent onwards" affordance only for data types the
registry gives an export capability. For a type with no export capability the
affordance SHALL be absent, because reporting that the type goes nowhere would
describe the absence of a route that cannot be created. For a type that can be
exported but has no enabled export route, the system SHALL report that it goes
nowhere, which there is true.

#### Scenario: An import-only type offers nothing

- **GIVEN** a data type with no export capability in the registry
- **WHEN** its row renders
- **THEN** no "sent onwards" affordance SHALL be present

#### Scenario: An exportable type with no enabled route says so

- **GIVEN** a data type with an export capability and no enabled export route
- **WHEN** its row renders
- **THEN** the row SHALL report that it is sent nowhere

### Requirement: The section claims no fallback and no transition date

No state records when a source stopped working or when another took over: the
fallback signal that exists is ranked-mode only, is scoped to a single day,
means "no record that day" rather than "this source broke", and does not cover
every type. The system SHALL NOT present a struck-through source, a "backup
since" date, a "stopped syncing" duration, or any other claim about a transition
between sources.

#### Scenario: No transition claim is rendered

- **WHEN** a row renders for a type with several sources
- **THEN** it SHALL NOT state that any source has been replaced, has fallen back, or has been a backup since some date

### Requirement: A row can switch each source's import route on and off

The system SHALL let a data type's row switch an individual source's import
route on or off, and SHALL treat this as a different decision from ranking: the
ranking control orders the sources a type already has, so a type with no enabled
route has nothing for it to act on. Without this control a source installed
after the seeding migrations already ran can never begin sending, because no
other surface creates an import route.

A route that is switched on SHALL be offered on the row whatever its bridge is
doing now, so it can always be switched back off; a route that is switched off
SHALL be offered only where its bridge is connected and is announcing the
capability the type requires, so the control never offers to create a route that
could carry nothing. A source the user has explicitly disconnected SHALL NOT be
offered a new route while its card on the same page reports it as not connected.

Switching a route SHALL preserve its stored mode, so a route set to sync only on
request does not silently become automatic by being switched off and on again.

#### Scenario: A newly installed source can be switched on

- **GIVEN** a connected source announcing a data type's capability and no import route for it
- **WHEN** the type's row is opened
- **THEN** that source SHALL be offered, switched off, and switching it on SHALL create the enabled import route

#### Scenario: An enabled route stays switchable off while its bridge is absent

- **GIVEN** an enabled import route whose bridge is announcing nothing
- **WHEN** the type's row is opened
- **THEN** that source SHALL still be offered, switched on

#### Scenario: A source that announces nothing for the type is not offered

- **GIVEN** a connected bridge announcing no capability for a data type and no route for it
- **WHEN** the type's row is opened
- **THEN** that source SHALL NOT be offered

#### Scenario: A disconnected source is not offered a new route

- **GIVEN** a source the user has disconnected
- **WHEN** a data type's row is opened
- **THEN** that source SHALL NOT be offered a route to switch on

#### Scenario: Switching a route off keeps its mode

- **GIVEN** an enabled import route stored with the manual mode
- **WHEN** it is switched off from the row
- **THEN** the stored mode SHALL still be manual

### Requirement: A row offers its source of truth to be changed only where that is a choice

The system SHALL offer a source-of-truth control on a data type's row when the
type has two or more sources it can be read from, or when a ranking is already
stored for it. It SHALL NOT offer one where the type has a single source under
the default unranked mode, because there is no second way to read it and the
control could only change the stored semantics without changing what is read.

A ranking already stored SHALL keep the control present as sources drop away, so
a type can always be returned to the default from the place it left it — down to
the last source, but no further: with no source at all there is nothing to pick,
nothing to keep, and no difference between the two modes, so the system SHALL NOT
offer a control there whatever mode is stored.

#### Scenario: A single-source type under the default mode offers no control

- **GIVEN** a data type with exactly one source and no stored ranking
- **WHEN** its row renders
- **THEN** no source-of-truth control SHALL be offered

#### Scenario: A ranked type keeps the control after losing a source

- **GIVEN** a data type with a stored ranking and only one source left
- **WHEN** its row renders
- **THEN** the control SHALL still be offered

#### Scenario: A ranked type with no source left offers no control

- **GIVEN** a data type with a stored ranking and no source at all
- **WHEN** its row renders
- **THEN** no source-of-truth control SHALL be offered

### Requirement: The change of read semantics is stated before it is made

Choosing a source of truth stores a ranked mode, which changes how the type is
READ: instead of keeping every source's record, the system consults the order and
reads the first source with a record. That consequence SHALL be presented on the
row, in terms of the row's own data type, before any control that would cause it
can be operated, and opening the control SHALL store nothing.

The statement SHALL describe both what the type does now and what picking would
change, and SHALL state that the change can be undone from the same place. A
requirement that can be satisfied while surprising the user is not satisfied.

Where a ranking is already stored, picking again only changes which source leads
and no read semantics change; the system SHALL NOT repeat the consequence
statement there, because a warning attached to a state it does not apply to
trains the reader to ignore it where it does.

#### Scenario: An unranked row explains the consequence before it happens

- **GIVEN** a data type with two or more sources and no stored ranking
- **WHEN** its source-of-truth control is opened
- **THEN** the row SHALL state that every source is currently kept with none ranked
- **AND** SHALL state that picking one will make the type be read from it first
- **AND** SHALL state that the choice can be undone from the same place
- **AND** no policy SHALL have been stored

#### Scenario: An already-ranked row is not warned about a change it cannot make

- **GIVEN** a data type with a stored ranking
- **WHEN** its source-of-truth control is opened
- **THEN** the row SHALL state which source it is read from today
- **AND** SHALL NOT present the consequence statement given to an unranked row

### Requirement: Returning a type to keeping every source is as reachable as leaving it

The system SHALL offer "keep every source" among the choices on every row that
offers the control, and SHALL present it as a peer of the sources rather than
behind a further step. Choosing it SHALL store the default unranked mode AND
discard the stored order, so a ranking cannot decide the type again the moment
the mode changes back.

#### Scenario: A ranked type can be returned to the default in one action

- **GIVEN** a data type with a stored ranked order
- **WHEN** "keep every source" is chosen
- **THEN** the unranked mode SHALL be stored
- **AND** the stored order SHALL be emptied

### Requirement: A source is offered only where it can serve the type

The system SHALL offer as a source of truth only sources the type is actually
read from, and only those able to serve it. An enabled import route whose bridge
does not support the route, or does not announce the capability the type
requires, SHALL NOT be offered — ranking it first would name a source that can
never produce a record.

A bridge whose capabilities are not yet known SHALL NOT be treated as unable:
absence of an answer is not a negative answer, and a source whose extension is
not running still owns the records the read resolver returns.

#### Scenario: An incapable but enabled route is not offered

- **GIVEN** an enabled import route whose bridge announces no capability for that data type
- **WHEN** the row's choices are derived
- **THEN** that source SHALL NOT be among them

#### Scenario: An unverified bridge stays offerable

- **GIVEN** an enabled import route whose bridge has announced no capabilities yet
- **WHEN** the row's choices are derived
- **THEN** that source SHALL still be among them

### Requirement: What is stored is what the reader resolves

The stored order SHALL begin with the source that was picked and SHALL retain
every other source the row can be read from, in their previous relative order, so
they remain ranked fallbacks rather than being dropped from a type they can still
serve. The source named by the row after the write SHALL be the source that was
picked.

A ranked order that resolves to no source SHALL NOT be stored. The control SHALL
achieve this by construction — it composes the order from the sources it offered,
and is not offered where there is none — rather than by rejecting a request it
cannot produce.

#### Scenario: The picked source leads and the others follow

- **GIVEN** a data type read from several sources
- **WHEN** one of them is picked as the source of truth
- **THEN** the stored order SHALL begin with it
- **AND** SHALL still contain every other source the type is read from

#### Scenario: A previous ranking survives beneath a new pick

- **GIVEN** a data type with a stored ranked order
- **WHEN** a different source is picked
- **THEN** the previously ranked sources SHALL keep their relative order behind it

#### Scenario: The row names the source that was picked

- **GIVEN** a source picked as the source of truth
- **WHEN** the row's origin is derived from what was stored
- **THEN** it SHALL name that source

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

### Requirement: The counters claim nothing until discovery has had its window

The counters SHALL render a placeholder, distinct from zero, until bridge
discovery has had the opportunity to hear from the extensions.

The completion of a connection refresh pass SHALL NOT be treated as that
opportunity. Nothing asks the extensions anything: they announce themselves
when injected, and discovery only broadcasts a request after a delay of
silence. A pass over a browser where nothing has yet announced therefore
completes almost immediately, having sent no message at all, so a surface
gated on it renders a confident zero to a fully equipped reader for as long as
discovery actually takes.

Discovery SHALL be treated as having had its window once any bridge is
detected — positive evidence that announcements are arriving — or once a grace
period has elapsed since discovery began listening. That period SHALL be
derived from the delay before discovery requests announcements and the ceiling
on verifying one, so it cannot drift from the behaviour it waits on. It SHALL
be measured from the start of discovery for the application, not from the mount
of the surface reading it, so a reader opening the surface later is not made to
wait for a window that closed long ago.

The placeholder SHALL NOT be permanent. A reader with no extensions installed
SHALL eventually be told so, so the surface SHALL state the count once the
grace period has elapsed even when nothing was ever detected.

Every surface that counts detected bridges SHALL apply this same gate, so two
surfaces counting the same thing cannot disagree while both are settling.

#### Scenario: A cold load counts nothing

- **GIVEN** discovery has just begun listening and no bridge has been detected
- **WHEN** the counters render
- **THEN** they SHALL render a placeholder and SHALL NOT render a count

#### Scenario: A completed pass is not mistaken for an answer

- **GIVEN** a connection refresh pass has completed while discovery is still in its grace period and no bridge has been detected
- **WHEN** the counters render
- **THEN** they SHALL still render a placeholder

#### Scenario: A detection answers immediately

- **GIVEN** at least one bridge has been detected, within the grace period
- **WHEN** the counters render
- **THEN** they SHALL render counts without waiting for the period to elapse

#### Scenario: An empty browser is eventually told so

- **GIVEN** no bridge was detected and the grace period has elapsed
- **WHEN** the counters render
- **THEN** they SHALL render the count, stating that none were detected

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

An extension speaking an unsupported protocol version SHALL be reported as out
of date rather than as a failed read, because the probe succeeded and signing in
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

#### Scenario: A failed read is stated without naming its cause

- **GIVEN** exactly one affected source whose probe came back without a usable read
- **WHEN** the consequence is stated
- **THEN** it SHALL state that Kaiord cannot read from that source, and SHALL NOT claim a credential expired or that the source is signed out

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

### Requirement: The retired connection surfaces resolve to the Connections page

The Connections page SHALL be the only surface that displays or changes which
sources are linked and where each data type is read from. The routing matrix at
`/settings/data-hub`, the bridge table at `/settings/extensions` and the
Connections section on the Athlete page SHALL NOT exist alongside it.

Both retired paths SHALL resolve to `/settings/connections` rather than falling
through to the Settings index: each was linked from the Settings index itself,
so both are in browser histories and bookmarks. The resolution SHALL replace its
history entry, so pressing Back from the Connections page does not return to the
retired path and bounce forward again. A section segment that is neither live
nor retired SHALL continue to resolve to the Settings index.

Neither retired path ever accepted a query string, so nothing is carried across
the resolution. Any surface that later needs a deep-linked sub-section of the
Connections page SHALL define it as a live `?section=` anchor rather than by
reviving a retired path.

The derivations the retired matrix was built on — the per-cell routing state and
the per-bridge sync freshness — SHALL survive its UI, because the assistant's
data-routing answers are computed from them. Retiring a surface SHALL NOT retire
a derivation that another consumer reads.

#### Scenario: A visitor arriving at a retired path lands on Connections

- **WHEN** a user opens `/settings/extensions` or `/settings/data-hub`
- **THEN** the Connections page SHALL render and the address SHALL read `/settings/connections`

#### Scenario: Back does not return to the retired path

- **GIVEN** a user who arrived at the Connections page through a retired path
- **WHEN** they navigate back
- **THEN** they SHALL reach whatever preceded the retired path, not the retired path itself

#### Scenario: An unknown section still falls back to the index

- **WHEN** a user opens a `/settings/<segment>` that is neither a live section nor a retired one
- **THEN** the Settings index SHALL render, and the Connections page SHALL NOT

#### Scenario: The Settings index stops offering the retired sections

- **WHEN** the Settings index is rendered
- **THEN** it SHALL offer a Connections row and SHALL NOT offer an Extensions row or a Data Hub row

#### Scenario: The Athlete page carries no connection state

- **GIVEN** an active athlete profile
- **WHEN** the Athlete page renders its body
- **THEN** it SHALL show identity, thresholds and zones only, and SHALL NOT present any source's connection state

#### Scenario: The assistant still answers routing questions

- **GIVEN** the routing matrix UI has been retired
- **WHEN** the user asks the assistant where a data type comes from
- **THEN** the answer SHALL still be derived from the same routing derivation the retired matrix used, so retiring the surface changes no answer

### Requirement: The Tanita export is offered once, from the source it reads

The manual Tanita → Garmin body-composition push SHALL be offered from exactly
one control, on the card of the source whose data it reads. A second copy on the
receiving source's card would own an independent copy of the transfer's state,
and both cards can be expanded at the same time, so the same upload could be
started twice with nothing downstream collapsing the duplicate push or its
export-ledger row.

The control SHALL remain gated on both bridges being present, so it is disabled
rather than failing part-way when the receiving bridge is absent. The receiving
source's card SHALL continue to name the route among what Kaiord sends back to
it, so retiring the second control does not hide that the route exists.

#### Scenario: The push is offered from the reading source

- **GIVEN** both bridges are present and the reading source's card is expanded
- **WHEN** the user looks for the body-composition push
- **THEN** exactly one control SHALL offer it, on that card

#### Scenario: The receiving source still names the route

- **WHEN** the receiving source's card is expanded
- **THEN** body composition SHALL appear among what Kaiord sends back to it

#### Scenario: The push is disabled without the receiving bridge

- **GIVEN** the reading source is present and the receiving bridge is not
- **WHEN** the control is rendered
- **THEN** it SHALL be disabled, rather than starting a transfer it cannot finish
