## MODIFIED Requirements

### Requirement: The rail lists sections, not index rows

While a section is open, the shell SHALL render a rail of the sections
themselves, one entry per section, and SHALL NOT render the index's row list
alongside the panel. The sections are General, AI, Sync, Data & backup, Privacy
and About. Rail entries SHALL be named by the section, using the same names the
page heading uses.

Connections SHALL NOT be a Settings section. External accounts are managed on
their own page (see `spa-connections-page`), so neither the rail nor the index
SHALL offer a Connections entry: one concept has one home, and a second way in
from Settings would be a second place to look for it.

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

#### Scenario: Connections is not a section

- **WHEN** the index renders, and then any section is opened
- **THEN** neither the index nor the rail SHALL offer an entry for Connections

#### Scenario: The index keeps its values

- **GIVEN** no section is open
- **WHEN** the index renders a row that declares a value key
- **THEN** the row SHALL render its resolved value

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

Connection attention is fixed on the Connections page, which is not a Settings
section, so the reader cannot reach it from the rail. The connection attention
model SHALL therefore declare an action that opens the Connections page.

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

#### Scenario: The banner leads to where the attention is fixed

- **GIVEN** a connection that needs attention
- **WHEN** the reader invokes the banner's action on the Settings index
- **THEN** the Connections page SHALL open

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

### Requirement: Retired section links land on their new home

A Settings link written for a section that no longer exists SHALL open the
section or page that now holds that content, replacing the history entry so
Back does not return to the retired address. `preferences` SHALL lead to
`general`, `usage` to the usage part of `ai`, the data-management part of
`privacy` to `data`, `profile` to the Athlete page, and `connections`,
`extensions` and `data-hub` to the Connections page.

#### Scenario: An old preferences link opens General

- **WHEN** the route is entered with the `preferences` section
- **THEN** the shell SHALL render the General panel, and the history SHALL hold only the General address

#### Scenario: An old connections link opens the Connections page

- **WHEN** the route is entered with the `connections`, `extensions` or `data-hub` section
- **THEN** the Connections page SHALL render, and the history SHALL hold only the Connections address

#### Scenario: An old data-management link opens Data & backup

- **WHEN** the route is entered with the `privacy` section and the `data-management` sub-section
- **THEN** the shell SHALL render the Data & backup panel

## REMOVED Requirements

### Requirement: The connections row counts a total it can reach, once it can count

**Reason**: Connections is no longer a Settings section, so the index has no connections row to answer.

**Migration**: The count lives on the Connections page beside its scope statement, counted over every source the page renders rather than over extensions alone (see `spa-connections-page`, "The page states whose connections they are and where they live").
