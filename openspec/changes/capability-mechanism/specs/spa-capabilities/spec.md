## ADDED Requirements

### Requirement: One catalogue declares every Capability and what it owns

The Kaiord App SHALL declare every Capability once, in one catalogue, with its id, an optional grade (`advanced` or `experimental`), the navigation destinations, routes, settings sections, editor commands, keyboard shortcuts and assistant Tools it owns (by the ids their registries use), the source modules of its screens, and optionally a table whose rows mean the athlete already used it. Adding a Capability SHALL need no change outside its catalogue entry and its strings.

#### Scenario: Templates is declared

- **WHEN** the catalogue is read
- **THEN** it SHALL hold `templates`, owning the `library` destination, the `/library` route and the Library screens, adopting the `templates` table

### Requirement: A Capability that is off leaves no trace

Every surface SHALL ask the read API before showing anything a Capability owns. While a Capability is off it SHALL be absent from the header, the More menu, the avatar menu and the bottom bar, from the settings index and rail, from the editor commands, the keyboard shortcuts and the shortcut sheet, from the Tools offered to the assistant and from its list of what it can do, from the setup checklist and from every link in another screen; a route it owns SHALL redirect to the Day once the athlete's decisions are known.

#### Scenario: A new athlete sees no Templates

- **GIVEN** a new athlete
- **WHEN** they open the App on a desktop or a phone, in English or Spanish
- **THEN** no Library destination, "Keep in library" action, "Template" tile or setup step for it SHALL show, AND opening the Library's address SHALL land on the Day

#### Scenario: A Tool of an off Capability is not offered

- **GIVEN** a Capability that owns a Tool is off
- **WHEN** the assistant's Tools are assembled for a turn
- **THEN** that Tool SHALL NOT be among them, nor named in what the assistant can do

### Requirement: The athlete activates or deactivates a Capability in one step without losing data

Settings, Capabilities SHALL list every Capability with its name, what it does and its grade, each with one switch. Turning one on SHALL bring back every surface it owns with its data; turning it off SHALL hide them and SHALL NOT delete or change any of its data. Nothing SHALL ask first: the switch is its own undo.

#### Scenario: Off and on again

- **GIVEN** an athlete with Templates off and one template kept
- **WHEN** they turn Templates on, then off again, then reload
- **THEN** the Library SHALL show the template while it is on, every trace SHALL be gone while it is off and after the reload, AND the template SHALL still be stored

### Requirement: The decision belongs to the athlete

The decision SHALL be stored per athlete on their preferences row, survive a reload, sync to their other devices with the cloud snapshot and travel in a backup file. With no decision recorded, a Capability SHALL read as off, unless it adopts a table that already holds the athlete's rows, in which case it SHALL read as on; a recorded decision SHALL always win.

#### Scenario: An existing athlete keeps their templates

- **GIVEN** an athlete who kept templates before Templates became a Capability
- **WHEN** they open the updated App
- **THEN** Templates SHALL be on and the Library SHALL show their templates

#### Scenario: The decision travels

- **WHEN** an athlete turns Templates on and syncs, or exports a backup and imports it into a clean browser
- **THEN** the other device and the clean browser SHALL have Templates on for that athlete

### Requirement: A guard keeps every surface behind the read API

`pnpm lint` SHALL fail when a production source file outside a Capability imports one of its modules without the read API, spells one of its routes outside the catalogue, or reads a surface registry outside that registry's gate; and when the catalogue, a declared module, a gate reader or a lookup can no longer be found.

#### Scenario: A screen links to the Library on its own

- **WHEN** a file outside Templates spells `"/library"` or imports a Library screen without the read API
- **THEN** `pnpm lint:capability-surfaces` SHALL fail naming the file
