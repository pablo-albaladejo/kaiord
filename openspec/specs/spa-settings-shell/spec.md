> Synced: 2026-07-29 (retire-legacy-connection-surfaces)

# SPA Settings Shell

## Purpose

The two-level Settings surface: one URL family whose optional section segment
selects the open panel, a mobile index that answers each row inline, a desktop
split that keeps the section rail beside the panel, and the two attention
surfaces (index banner, rail chip) that report connection health without ever
restating it twice on one screen.

## Requirements

### Requirement: One settings URL family selects the open section

The Settings shell SHALL own a single route whose optional trailing segment
names the open section. The bare path SHALL render the section index; a path
carrying a known section SHALL render that section's panel; a path carrying an
unknown segment SHALL redirect to the bare path rather than render an empty
shell. The section segment SHALL be the panel's identity everywhere — its
container id, its test id and its heading suffix all derive from it — so a
section cannot be reachable under one name and addressable under another.

#### Scenario: The bare path renders the index

- **WHEN** the Settings route is entered with no section segment
- **THEN** the shell SHALL render the grouped section list and no section panel

#### Scenario: A known section renders its panel

- **GIVEN** a section segment naming a registered panel
- **WHEN** the route is entered
- **THEN** the shell SHALL render that panel in a container addressable as `settings-panel-<section>`, and the heading SHALL name the section

#### Scenario: An unknown section redirects

- **WHEN** the route is entered with a segment naming no registered panel
- **THEN** the shell SHALL redirect to the bare Settings path

### Requirement: Sections retired by a later wave keep resolving

Sections scheduled for retirement SHALL remain first-class members of the
section set until the wave that retires them ships. Their URLs SHALL resolve to
their own panels with no redirect and no interstitial, and their row test ids
SHALL be unchanged, so surfaces and tests that link to them keep working while
the replacement is built.

#### Scenario: The legacy data-routing section still resolves

- **WHEN** the Data Hub section's URL is entered directly
- **THEN** its own panel SHALL render and no redirect SHALL occur

#### Scenario: The legacy extensions section still resolves

- **WHEN** the Extensions section's URL is entered directly
- **THEN** its own panel SHALL render and no redirect SHALL occur

### Requirement: The index and the desktop split are one tree switched by CSS

The shell SHALL express the difference between the narrow drill-in layout and
the wide split layout entirely through style, never by measuring the viewport in
JavaScript. The rendered element tree SHALL be identical at every width, so a
test environment that reports no media query as matching observes the same
structure a browser does.

Consequently the shell SHALL NOT mount a second copy of any row, panel or
heading to serve the other layout: every test id in the shell SHALL resolve to
exactly one element at any URL, and no string the shell renders SHALL duplicate
a string the open panel renders.

#### Scenario: No viewport is measured

- **WHEN** the shell renders
- **THEN** it SHALL NOT consult `matchMedia` or any viewport dimension to choose its layout

#### Scenario: Identity stays unambiguous while a section is open

- **GIVEN** a section is open, so both the section rail and the section panel are mounted
- **WHEN** any test id the shell renders is resolved
- **THEN** exactly one element SHALL match it

### Requirement: The rail lists sections, not index rows

While a section is open, the shell SHALL render a rail of the sections
themselves, one entry per section, and SHALL NOT render the index's row list
alongside the panel. The index's rows are not in one-to-one correspondence with
sections — several rows may lead to the same section — so a row-shaped rail
would mark more than one entry as current for a single open section and would
repeat the panel's own headings word for word. Rail entries SHALL be named by
the section, using the same names the page heading uses.

Exactly one entry SHALL be marked as the current page for any open section, and
that mark SHALL be exposed to assistive technology, not only through colour.

The rail SHALL be hidden at narrow widths, where the panel takes the whole
surface, and the index SHALL keep its inline row values when it is the surface
being shown.

#### Scenario: One entry per section

- **GIVEN** a section is open
- **WHEN** the rail renders
- **THEN** it SHALL render exactly one entry per registered section, and no element carrying an index row's test id

#### Scenario: Exactly one entry is current, including for a shared destination

- **GIVEN** the preferences section is open, which three separate index rows lead to
- **WHEN** the rail renders
- **THEN** exactly one element in the shell SHALL carry `aria-current="page"`, and it SHALL be the preferences entry

#### Scenario: The rail does not echo the panel's headings

- **GIVEN** the preferences section is open, whose panel heads its groups "Units" and "Notifications"
- **WHEN** the rail renders
- **THEN** no rail entry SHALL render a string identical to one of those headings

#### Scenario: The index keeps its values

- **GIVEN** no section is open
- **WHEN** the index renders a row that declares a value key
- **THEN** the row SHALL render its resolved value

### Requirement: Only the surface being shown reads the values it displays

The index's row values SHALL be read only where they are rendered. A surface
that displays no row value SHALL NOT mount the live queries that resolve them,
so opening a section does not duplicate the panel's own subscriptions, and so no
credential is decrypted to produce output that is discarded.

#### Scenario: The rail subscribes to nothing

- **GIVEN** a section is open, so the rail rather than the index is rendered
- **WHEN** the shell renders
- **THEN** the row-value queries SHALL NOT be mounted by the shell

#### Scenario: The index subscribes once

- **GIVEN** no section is open
- **WHEN** the index renders
- **THEN** the row-value queries SHALL be mounted exactly once for the page

### Requirement: The shell exposes exactly one route heading

The Settings shell SHALL render exactly one element carrying the route-heading
attribute at any URL, whichever layout applies, so the focus-on-route-change
contract resolves one unambiguous target. The heading SHALL name the open
section when there is one, so the announced label distinguishes sections.

#### Scenario: One heading on the index

- **WHEN** the bare Settings path renders
- **THEN** exactly one element carrying the route-heading attribute SHALL be present

#### Scenario: One heading with a section open

- **WHEN** a section path renders, mounting both the rail and the panel
- **THEN** exactly one element carrying the route-heading attribute SHALL be present, and its text SHALL name the section

### Requirement: Changing section resets the scroll position

When the open section changes, the shell SHALL return the document scroll to the
top, so a section is never entered already scrolled to the offset the previous
one left behind. The reset SHALL NOT run on the first render, so a deep link
that also asks for a sub-section anchor is scrolled by the anchor rather than
fought by the reset. A change that only alters the sub-section query SHALL NOT
reset the scroll.

#### Scenario: Moving between sections returns to the top

- **GIVEN** a section scrolled away from the top
- **WHEN** a different section is opened
- **THEN** the document scroll SHALL be reset to the top

#### Scenario: Closing a section returns to the top

- **GIVEN** a section scrolled away from the top
- **WHEN** the shell returns to the index
- **THEN** the document scroll SHALL be reset to the top

#### Scenario: A first render is left alone

- **GIVEN** a scroll offset already applied when the shell mounts
- **WHEN** the shell renders for the first time
- **THEN** the scroll offset SHALL be left unchanged

### Requirement: Attention slots render one model, or nothing

The shell SHALL carry two attention surfaces — a banner above the content and a
chip at the top of the rail — fed by an attention model that MAY be absent. An
absent model SHALL render nothing at all: no container, no placeholder and no
skeleton.

The two surfaces SHALL render the same model and SHALL NOT both render it. The
index SHALL carry the banner and an open section SHALL carry the chip, so one
screen never states the same consequence twice.

Because the model is derived from state that arrives asynchronously, a surface
appears after its page has rendered and can appear again later. Each surface
SHALL therefore be a polite live region, so it announces itself rather than
waiting to be found, and each line SHALL carry its own full text where the
layout may truncate it.

The banner SHALL carry the model's action when it declares one; the chip SHALL
NOT, being a summary rather than a control. A model MAY decline to declare an
action, and SHALL do so while no surface can act on the attention it reports.

#### Scenario: No attention renders no surface

- **GIVEN** an absent attention model
- **WHEN** either slot renders
- **THEN** no element SHALL be rendered for that slot

#### Scenario: A supplied model renders its consequence

- **GIVEN** an attention model naming what broke and its consequence
- **WHEN** the banner renders
- **THEN** both lines SHALL be displayed, and the model's action SHALL be invocable

#### Scenario: The chip omits the action

- **GIVEN** an attention model declaring an action
- **WHEN** the chip renders
- **THEN** the action SHALL NOT be rendered

#### Scenario: The index announces attention on the banner

- **GIVEN** a connection that needs attention
- **WHEN** the Settings index renders
- **THEN** the banner SHALL state the consequence and the chip SHALL NOT be present

#### Scenario: An open section announces attention on the rail

- **GIVEN** a connection that needs attention
- **WHEN** a section is open
- **THEN** the chip SHALL state the consequence and the banner SHALL NOT be present

#### Scenario: An appearing surface announces itself

- **WHEN** either surface renders its model
- **THEN** it SHALL be a polite live region, so its arrival is announced to assistive technology

### Requirement: The shell counts exactly what the Connections section marks

The shell SHALL derive its attention model from the same per-source status the
Connections section renders its cards from, and SHALL count a source as needing
attention when — and only when — that status is the attention one. It SHALL NOT
carry a second predicate over the raw connection rows: a summary that can
disagree with the surface it summarises is worse than no summary, and the
card-status derivation already resolves the cases a naive rule gets wrong.

Those cases are the reason the rule is not "present but no session": a source
that is never session-probed reads as installed rather than broken, one whose
first probe has not answered reads as being checked, and one the user unlinked
or whose extension is not running reads as available. None of them is a fault
to announce.

The model SHALL name how many sources are affected and SHALL NOT name which
ones, so no source name is interpolated into the announcement.

#### Scenario: An affected source is counted

- **GIVEN** a source whose card is marked as needing attention
- **WHEN** the attention model is derived
- **THEN** that source SHALL be counted, and the count SHALL equal the number of such cards

#### Scenario: An unprobed present source is not attention

- **GIVEN** a source that is never session-probed, and therefore reports no session and no error
- **WHEN** the attention model is derived
- **THEN** it SHALL NOT be counted as needing attention

#### Scenario: A source awaiting its first answer is not attention

- **GIVEN** a probed source whose first probe has not recorded an answer
- **WHEN** the attention model is derived
- **THEN** it SHALL NOT be counted, because not knowing is not the same as broken

#### Scenario: An absent or unlinked source is not attention

- **GIVEN** a source the user unlinked, or whose extension is not running
- **WHEN** the attention model is derived
- **THEN** it SHALL NOT be counted as needing attention

#### Scenario: No affected source produces no model

- **GIVEN** no source is marked as needing attention
- **WHEN** the attention model is derived
- **THEN** the model SHALL be absent and both slots SHALL render nothing

### Requirement: The consequence line is ranked by what the reader can act on

The attention model's consequence line SHALL be derived from state that
survives a page reload or from the connection's own reported cause, and SHALL
prefer a cause the reader can act on over one they can only read. A demand to
sign in again and an extension speaking an unsupported protocol version each
name their own fix, and each routinely coexists with a recorded last-sync time,
so both SHALL outrank the date.

An unsupported protocol version SHALL NOT be reported as a session problem: the
probe succeeded and produced a diagnosis, and signing in again would fix
nothing, so the line SHALL say the extension is out of date.

Every remaining affected source is a reachable extension without a usable
session, so the line SHALL describe it as signed out — the same verdict its
card states — and SHALL NOT claim that a credential expired or that the check
itself failed. Only one bridge's probe distinguishes an expired credential from
one that was never issued, and no probe reports a failure the card calls a
session problem.

The time of the last probe SHALL NOT be presented as the time a source broke,
and no duration of breakage SHALL be stated, because no transition timestamp is
recorded anywhere. A date SHALL be attached only when exactly one connection is
affected, so one source's date is never presented as a set's, and it SHALL be
the reader's calendar day rather than the UTC one.

#### Scenario: A single affected source dates its consequence

- **GIVEN** exactly one connection needs attention, it has a recorded last-sync time, and it reports no actionable cause
- **WHEN** the consequence line is built
- **THEN** it SHALL state that no new data has arrived since that date, in the reader's own calendar day

#### Scenario: A sign-in instruction outranks the date

- **GIVEN** an affected connection demanding re-authorisation that also has a recorded last-sync time
- **WHEN** the consequence line is built
- **THEN** it SHALL state that the session is signed out, and SHALL NOT state that a credential expired

#### Scenario: An outdated extension is told to update

- **GIVEN** an affected source whose probe answered with an unsupported protocol version
- **WHEN** the consequence line is built
- **THEN** it SHALL state that an extension is out of date, and SHALL NOT tell the user to sign in

#### Scenario: Several affected sources state the cause, not a date

- **GIVEN** more than one source needs attention and none reports an actionable cause
- **WHEN** the consequence line is built
- **THEN** it SHALL state that the session is signed out and SHALL NOT state a date belonging to one of them

#### Scenario: An unusable timestamp is ignored

- **GIVEN** an affected source whose recorded last-sync value does not parse as a date
- **WHEN** the consequence line is built
- **THEN** the date SHALL be omitted rather than rendered as an invalid value

### Requirement: The connections row counts a total it can reach, once it can count

The Settings index row leading to the connection surfaces SHALL answer itself
with how many known bridges are answering in this browser, out of all known
bridges. It SHALL count detected bridges rather than live sessions, because at
least one bridge is never probed and a session count could therefore never
equal its own denominator — a counter fixed one short of completion reads as a
defect rather than as a state.

The count SHALL be described as detected rather than installed: a page cannot
enumerate installed extensions, only those that announced themselves and
answered this page-life.

The row SHALL render no value until bridge discovery has had the opportunity to
hear from the extensions, and SHALL apply the same gate as every other surface
counting detected bridges, so two surfaces counting the same thing cannot
disagree while both are settling.

The completion of a connection refresh pass SHALL NOT be treated as that
opportunity. Nothing asks the extensions anything — they announce themselves
when injected — so a pass over a browser where nothing has yet announced
completes almost immediately having sent no message, and a row gated on it
states a confident zero to a fully equipped reader for as long as discovery
actually takes.

The row SHALL NOT withhold its value indefinitely: once the grace period has
elapsed it SHALL state the count even when nothing was detected, because a
reader with no extensions installed has to be told so.

<!-- The prior requirement also said the row renders no value "when no bridge
is known at all, rather than a zero-of-zero count". That condition is removed:
the snapshot reader synthesises one row per known bridge from the first render,
so the empty list it guards cannot occur in the application. It was a guard on
an unreachable state standing next to the reachable one it was mistaken for. -->

#### Scenario: The row states detected out of known

- **GIVEN** discovery has settled and two of five known bridges answered
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state two of five detected

#### Scenario: The count reaches its denominator

- **GIVEN** every known bridge answered, including one that is never probed
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state the full count of detected bridges out of the same total

#### Scenario: A cold load claims nothing

- **GIVEN** discovery has just begun listening and no bridge has been detected
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL render no count

#### Scenario: A detection answers immediately

- **GIVEN** at least one bridge has been detected, within the grace period
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state its count without waiting for the period to elapse

#### Scenario: An empty browser is eventually told so

- **GIVEN** no bridge was detected and the grace period has elapsed
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state that none of the known bridges were detected

### Requirement: The connection store runs for the session, not for a page

The connection store SHALL be started once per application boot by the app's
store hydration, not by the surface that renders it. A store bound to a page
would restart on every visit and re-probe every bridge, defeating the positive
cache, the poll interval and the visibility floor that the store's lifecycle
owns.

The store SHALL expose whether a refresh pass has completed, and SHALL notify
its subscribers when the first pass completes even if no row changed, so a
consumer can distinguish "not asked yet" from "not there".

#### Scenario: Hydration starts the connection store

- **WHEN** the application hydrates its stores
- **THEN** the bridge connection store SHALL be started

#### Scenario: The store outlives the settings surface

- **WHEN** the surface that renders connection state unmounts
- **THEN** the connection store SHALL keep running for the rest of the session

#### Scenario: The first pass is announced even when nothing changed

- **GIVEN** a refresh pass over a browser where no bridge is present, so every row keeps its default
- **WHEN** the pass completes
- **THEN** subscribers SHALL be notified, and the store SHALL report that a pass has completed
