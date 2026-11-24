## ADDED Requirements

### Requirement: One catalogue declares every Capability and what it owns

The Kaiord App SHALL declare every Capability once, in one catalogue, with its id, an optional grade (`advanced` or `experimental`), the navigation destinations, routes, settings sections and assistant Tools it owns (by the ids their registries use), the parts of other screens it owns (each by an id the catalogue names, so a misspelt id fails typecheck), and optionally a table whose rows mean the athlete already used it. The source modules of its screens SHALL be declared beside the guard that reads them, outside the App's first load. Adding a Capability SHALL need no change outside its catalogue entry, its modules and its strings.

#### Scenario: Templates is declared

- **WHEN** the catalogue is read
- **THEN** it SHALL hold `templates`, owning the `library` destination, the `/library` route and the Library screens, adopting the `templates` table

### Requirement: A Capability that is off leaves no trace

Every surface SHALL ask the read API before showing anything a Capability owns. While a Capability is off it SHALL be absent from the header, the More menu, the avatar menu and the bottom bar, from the settings index and rail, from the Tools offered to the assistant and from its list of what it can do, from the setup checklist and from every link in another screen; a route it owns SHALL redirect to the Day once the athlete's decisions are known, however its address is spelt (any case, a trailing slash, encoded characters, a query or a hash), including when reached by the browser's back or forward.

#### Scenario: A new athlete sees no Templates

- **GIVEN** a new athlete
- **WHEN** they open the App on a desktop or a phone, in English or Spanish
- **THEN** no Library destination, "Keep in library" action, "Template" tile or setup step for it SHALL show, AND opening the Library's address SHALL land on the Day

#### Scenario: The Library's address spelt another way

- **GIVEN** Templates is off
- **WHEN** the athlete opens `/Library`, `/library/`, `/%6Cibrary`, `/library?x=1` or `/library#x`, or goes back in the browser to a Library page
- **THEN** the Library SHALL NOT show, AND the App SHALL land on the Day

#### Scenario: A Tool of an off Capability is not offered

- **GIVEN** a Capability that owns a Tool is off
- **WHEN** the assistant's Tools are assembled for a turn
- **THEN** that Tool SHALL NOT be among them, nor named in what the assistant can do

### Requirement: The athlete activates or deactivates a Capability in one step without losing data

Settings, Features (Spanish "Funciones") SHALL list every Capability with its name, what it does and its grade, each with one switch. Turning one on SHALL bring back every surface it owns with its data; turning it off SHALL hide them and SHALL NOT delete or change any of its data. Nothing SHALL ask first: the switch is its own undo.

#### Scenario: Off and on again

- **GIVEN** an athlete with Templates off and one template kept
- **WHEN** they turn Templates on, then off again, then reload
- **THEN** the Library SHALL show the template while it is on, every trace SHALL be gone while it is off and after the reload, AND the template SHALL still be stored

### Requirement: The decision belongs to the athlete

The decision SHALL be stored per athlete as a record of its own, apart from the preferences row, survive a reload, sync to their other devices with the cloud snapshot and travel in a backup file. With no decision recorded, a Capability SHALL read as off, unless it adopts a table that already holds the athlete's rows, in which case it SHALL read as on; a recorded decision SHALL always win. No write of the preferences row, by this version or an older one, SHALL change a decision, and a preferences write SHALL keep every field of the row it does not know.

#### Scenario: An existing athlete keeps their templates

- **GIVEN** an athlete who kept templates before Templates became a Capability
- **WHEN** they open the updated App
- **THEN** Templates SHALL be on and the Library SHALL show their templates

#### Scenario: An older device writes its preferences later

- **GIVEN** an athlete turned Templates off on an updated device, and templates exist
- **WHEN** a device on an older version changes the calendar view later and both sync
- **THEN** Templates SHALL stay off on both devices, AND the calendar view SHALL be the older device's

#### Scenario: The decision travels

- **WHEN** an athlete turns Templates on and syncs, or exports a backup and imports it into a clean browser
- **THEN** the other device and the clean browser SHALL have Templates on for that athlete

### Requirement: A guard keeps every surface behind the read API

`pnpm lint` SHALL fail when a production source file outside a Capability imports one of its modules without the read API, spells one of its routes or the path of a settings section it owns outside the catalogue, reads a surface registry outside that registry's gate, or reads the athlete's decisions without resolving them through the read API; only a value import of the read API SHALL count as asking it; and when the catalogue, a Capability's modules, a declared module, a gate reader or a lookup can no longer be found.

#### Scenario: A screen links to the Library on its own

- **WHEN** a file outside Templates spells `"/library"` or imports a Library screen without the read API
- **THEN** `pnpm lint:capability-surfaces` SHALL fail naming the file
