## ADDED Requirements

### Requirement: Athletes are managed on a routed page

The athletes stored in this browser SHALL be managed on a routed page,
`/athletes`, and not in a dialog. The page SHALL list every athlete and mark
the active one, and SHALL let the user create an athlete, rename one in place,
make another one active, export one athlete as a file, import an athlete file
as a new athlete, and delete an athlete only after a confirmation. The only
remaining athlete SHALL NOT be deletable. The page SHALL point to the full
backup in Settings for copying everything. The account menu's "Manage
athletes…" entry and the Athlete page's empty state SHALL lead to `/athletes`.

On `/athlete` the active athlete's name SHALL be renamed in place, and the
personal data (height, birth date, sex, resting heart rate, activity level)
SHALL be edited in the Body section, so no field needs a dialog.

#### Scenario: Manage athletes opens the page

- **GIVEN** the user has two athletes
- **WHEN** they choose "Manage athletes…" in the account menu
- **THEN** the URL is `/athletes`, both athletes are listed and no dialog opens

#### Scenario: Deleting asks first

- **GIVEN** the user is on `/athletes` with two athletes
- **WHEN** they choose to delete one
- **THEN** a confirmation names the athlete, and the athlete is deleted only once they confirm

#### Scenario: The last athlete stays

- **GIVEN** only one athlete exists
- **WHEN** the user is on `/athletes`
- **THEN** that athlete's delete control is disabled

## MODIFIED Requirements

### Requirement: The athlete's zone editor is a routed page

The athlete's training zones SHALL be edited on a routed page,
`/athlete/zones/:sport`, where `sport` is one of `cycling`, `running`,
`swimming` or `generic`. The page's sport tabs SHALL be part of the address:
choosing a tab SHALL replace the URL with that sport's, so a reload or a shared
link opens on the same sport. An unknown `sport` SHALL redirect (replace) to
`/athlete/zones/cycling`, and the page SHALL redirect to `/athlete` when there
is no active profile. The Athlete page's zones card SHALL link to the page for
the sport the athlete is looking at.

Each threshold SHALL have one home. The thresholds of cycling, running and
swimming (FTP, LTHR, threshold pace or CSS) and the maximum heart rate SHALL be
edited in place on `/athlete`, saving on blur or Enter and saying when the
value was saved; there SHALL be no threshold dialog. The zone editor page SHALL
show those thresholds read-only with a link back to `/athlete`; only the
generic sport, which has no place on `/athlete`, SHALL edit its LTHR beside its
zones. No other surface SHALL edit zones. A sport with no zone configuration
yet SHALL still show its tabs and thresholds, and setting a threshold SHALL
create that configuration.

#### Scenario: "Adjust zones" opens on the active sport

- **GIVEN** the athlete is on `/athlete` looking at Running
- **WHEN** they follow "Adjust zones"
- **THEN** the URL is `/athlete/zones/running` and the Running tab is selected

#### Scenario: The chosen sport survives a reload

- **GIVEN** the athlete is on `/athlete/zones/cycling`
- **WHEN** they choose the Swimming tab and reload
- **THEN** the URL is `/athlete/zones/swimming` and the Swimming tab is selected

#### Scenario: A threshold is edited in place

- **GIVEN** the athlete is on `/athlete` looking at Cycling
- **WHEN** they type an FTP and press Enter
- **THEN** the FTP is stored, the card says it was saved, and no dialog opens
