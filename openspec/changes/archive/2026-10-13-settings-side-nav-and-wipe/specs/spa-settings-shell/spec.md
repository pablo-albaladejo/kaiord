## MODIFIED Requirements

### Requirement: One settings URL family selects the open section

The Settings shell SHALL own a single route whose optional trailing segment
names the open section. The bare path SHALL render the section index; a path
carrying a known section SHALL render that section's panel; a path carrying a
retired section name SHALL redirect to the section that now holds its content;
a path carrying any other unknown segment SHALL redirect to the bare path rather
than render an empty shell. The section segment SHALL be the panel's identity
everywhere — its container id, its test id and its heading suffix all derive
from it — so a section cannot be reachable under one name and addressable under
another.

#### Scenario: The bare path renders the index

- **WHEN** the Settings route is entered with no section segment
- **THEN** the shell SHALL render the section list, with the General preferences editable inline, and no section panel

#### Scenario: A known section renders its panel

- **GIVEN** a section segment naming a registered panel
- **WHEN** the route is entered
- **THEN** the shell SHALL render that panel in a container addressable as `settings-panel-<section>`, and the heading SHALL name the section

#### Scenario: An unknown section redirects

- **WHEN** the route is entered with a segment naming no registered panel and no retired section
- **THEN** the shell SHALL redirect to the bare Settings path

### Requirement: The rail lists sections, not index rows

While a section is open, the shell SHALL render a rail of the sections
themselves, one entry per section, and SHALL NOT render the index's row list
alongside the panel. The sections are General, AI, Sync, Data & backup, Privacy
and About, followed by Connections, set apart from them. Rail entries SHALL be
named by the section, using the same names the page heading uses.

The index SHALL list the same sections, in the same order and under the same
names, one row per section, each with an icon no other row uses. No two rows
SHALL lead to the same section. The General section SHALL be edited inline on
the index, under a heading carrying its name, rather than through a row.

Exactly one entry SHALL be marked as the current page for any open section, and
that mark SHALL be exposed to assistive technology, not only through colour.

The rail SHALL be hidden at narrow widths, where the panel takes the whole
surface, and the index SHALL keep its inline row values when it is the surface
being shown.

#### Scenario: One entry per section

- **GIVEN** a section is open
- **WHEN** the rail renders
- **THEN** it SHALL render exactly one entry per registered section, and no element carrying an index row's test id

#### Scenario: Exactly one entry is current

- **GIVEN** the General section is open
- **WHEN** the rail renders
- **THEN** exactly one element in the shell SHALL carry `aria-current="page"`, and it SHALL be the General entry

#### Scenario: The index and the rail name the same sections

- **WHEN** the index renders, and then any section is opened
- **THEN** the General heading followed by the index row names SHALL equal the rail entry names, in order

#### Scenario: The index keeps its values

- **GIVEN** no section is open
- **WHEN** the index renders a row that declares a value key
- **THEN** the row SHALL render its resolved value

## ADDED Requirements

### Requirement: Retired section links land on their new home

A Settings link written for a section that no longer exists SHALL open the
section that now holds that content, replacing the history entry so Back does
not return to the retired address. `preferences` SHALL lead to `general`,
`usage` to the usage part of `ai`, `extensions` and `data-hub` to
`connections`, and the data-management part of `privacy` to `data`.

#### Scenario: An old preferences link opens General

- **WHEN** the route is entered with the `preferences` section
- **THEN** the shell SHALL render the General panel, and the history SHALL hold only the General address

#### Scenario: An old data-management link opens Data & backup

- **WHEN** the route is entered with the `privacy` section and the `data-management` sub-section
- **THEN** the shell SHALL render the Data & backup panel

### Requirement: Data & backup can delete everything in this browser

The Data & backup section SHALL offer to delete all of the reader's data in this
browser. The confirm control SHALL stay disabled until the reader types a
confirmation word in the UI's language, and while a sync is in flight.

Confirming SHALL stop sync, then empty every store of the local database in one
transaction — enumerating the stores the database has rather than a list in
code — then clear this origin's localStorage and sessionStorage, then reload
into first run. It SHALL write no tombstone, so a later sync re-imports the
Google Drive copy rather than deleting it, and the dialog SHALL say that the
Drive copy is kept. If emptying the database fails, the SPA SHALL report it and
SHALL NOT clear storage or reload.

#### Scenario: The word gates the delete

- **GIVEN** the Spanish UI
- **WHEN** the reader types a prefix of the confirmation word
- **THEN** the confirm control SHALL stay disabled until the full word is typed

#### Scenario: A confirmed wipe starts over

- **GIVEN** a profile and a workout stored in this browser
- **WHEN** the reader confirms the delete
- **THEN** the app SHALL reload into first run with an empty database and the browser-language defaults

#### Scenario: The Drive copy survives a later sync

- **GIVEN** a wipe has emptied the local database
- **WHEN** sync runs against a Drive copy holding workouts
- **THEN** those workouts SHALL stay in Drive and no tombstone SHALL be pushed

#### Scenario: A failed wipe keeps the session

- **GIVEN** emptying the database fails
- **WHEN** the reader confirms the delete
- **THEN** an error SHALL be reported and storage SHALL NOT be cleared nor the page reloaded
