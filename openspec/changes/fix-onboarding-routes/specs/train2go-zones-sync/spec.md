## MODIFIED Requirements

### Requirement: Zone-sync toggle is opt-in per linked Train2Go account

Zone sync for a linked Train2Go account SHALL be governed by the profile's
training-zones import route from `train2go-bridge`, which superseded the
`linkedAccounts[i].syncZones` flag. Zones SHALL fan out automatically only while
that route is enabled with the automatic mode. When an account is first linked
and no training-zones route exists, the link SHALL create one with the automatic
mode only if the profile holds no threshold value; a profile that already holds
a threshold SHALL get the route with the manual mode, so the link never
overwrites values the athlete entered. Switching the route off SHALL NOT revert
previously-synced threshold values in the profile (the route controls future
syncs only).

#### Scenario: First-time link defaults the toggle off

- **GIVEN** a profile that holds at least one threshold value and no training-zones import route
- **WHEN** a user runs the Train2Go connect dance for the first time
- **THEN** the training-zones import route from `train2go-bridge` SHALL be enabled with the manual mode
- **AND** no zones-sync request SHALL be issued

#### Scenario: First-time link of a profile without thresholds fills its zones

- **GIVEN** a profile that holds no threshold value and no training-zones import route
- **WHEN** a user runs the Train2Go connect dance for the first time
- **THEN** the training-zones import route from `train2go-bridge` SHALL be enabled with the automatic mode
- **AND** exactly one zones-sync request SHALL be issued

#### Scenario: Disabling the toggle does not revert prior data

- **GIVEN** a user previously synced zones with the route on, and FTP=270 was written to their profile
- **WHEN** the user switches the training-zones import route off
- **THEN** the persisted FTP value SHALL remain 270
- **AND** subsequent calendar syncs SHALL NOT issue a zones-fetch
