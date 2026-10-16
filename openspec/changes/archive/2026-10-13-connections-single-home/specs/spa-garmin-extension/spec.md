## MODIFIED Requirements

### Requirement: The Garmin bridge's status is presented with every other source

The Garmin bridge SHALL have no Settings surface of its own. Its status SHALL be
presented on the Connections page (`/connections`, see
`spa-connections-page`) as one card among every registered source, so no surface
is named after one vendor and no bridge can be reachable from a place the others
are not. The `/settings/extensions` table this requirement previously described
is retired and its path resolves to the Connections page.

#### Scenario: Garmin is one source card among the rest

- **WHEN** the user opens the Connections page
- **THEN** the Garmin bridge SHALL be presented as one source card alongside the other registered sources

#### Scenario: No Garmin-specific Settings section exists

- **WHEN** the Settings index is rendered
- **THEN** it SHALL offer no Extensions row and no section dedicated to a single bridge
