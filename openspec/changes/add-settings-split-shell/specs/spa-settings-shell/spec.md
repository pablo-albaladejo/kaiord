## ADDED Requirements

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

### Requirement: Attention slots render nothing until something computes attention

The shell SHALL carry two attention surfaces — a banner above the content and a
chip at the top of the rail — fed by an attention model that MAY be absent. An
absent model SHALL render nothing at all: no container, no placeholder and no
skeleton. The shell SHALL pass an absent model until a capability that derives
attention from real connection state is mounted, and no attention copy SHALL be
added to the locale catalogs before then, so no catalog holds a sentence no code
can produce.

The banner SHALL carry the model's action when it declares one; the chip SHALL
NOT, being a summary rather than a control.

#### Scenario: No attention renders no surface

- **GIVEN** an absent attention model
- **WHEN** either slot renders
- **THEN** no element SHALL be rendered for that slot

#### Scenario: The shell renders no attention today

- **WHEN** any Settings URL renders
- **THEN** neither the banner nor the chip SHALL be present, because nothing computes attention yet

#### Scenario: A supplied model renders its consequence

- **GIVEN** an attention model naming what broke and its consequence
- **WHEN** the banner renders
- **THEN** both lines SHALL be displayed, and the model's action SHALL be invocable

#### Scenario: The chip omits the action

- **GIVEN** an attention model declaring an action
- **WHEN** the chip renders
- **THEN** the action SHALL NOT be rendered
