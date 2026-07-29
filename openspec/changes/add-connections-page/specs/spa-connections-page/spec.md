## ADDED Requirements

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
being checked. A source whose session is not usable SHALL be described as signed
out, and SHALL NOT claim that a credential expired, because no probe
distinguishes an expired credential from one that was never issued. No card
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

#### Scenario: An unusable session

- **GIVEN** a discovered source whose last probe found no usable session
- **WHEN** its card renders
- **THEN** it SHALL be described as signed out, and no copy SHALL assert that a credential expired

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
