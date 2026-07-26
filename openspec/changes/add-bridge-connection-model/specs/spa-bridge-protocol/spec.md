## MODIFIED Requirements

### Requirement: Bridge lifecycle management

The SPA SHALL track each bridge's liveness by re-probing every discovered bridge on a 5-minute interval and forcing a re-probe when the document becomes visible, throttled to at most once per 60 seconds. A bridge is either discovered or not (bridge discovery owns that), and a discovered bridge either holds a live upstream session or does not; there is no UNAVAILABLE state and no REMOVED state in v1. Only bridges exposing a cheap, side-effect-free session action are probed; the rest report discovery alone. The resulting state SHALL be kept in memory only and SHALL NOT be written to Dexie — no `lastSeen` timestamp is persisted, per the bridge persistence boundary. Probes SHALL run outside the shared operation queue so they neither queue behind long data reads nor consume the hourly operation budget.

#### Scenario: Periodic re-probe

- **GIVEN** a discovered bridge with a live session
- **WHEN** the 5-minute polling interval fires
- **THEN** the SPA SHALL re-probe the bridge and refresh its in-memory connection state

#### Scenario: Probe failure disables bridge affordances

- **GIVEN** a discovered bridge whose extension no longer answers
- **WHEN** its probe fails
- **THEN** the bridge SHALL report `sessionActive: false` and bridge-dependent affordances SHALL render as unavailable, while its `IntegrationPolicy` rows remain untouched

#### Scenario: Returning to the tab forces a refresh

- **GIVEN** the SPA tab has been in the background for more than 60 seconds
- **WHEN** the document becomes visible again
- **THEN** a forced re-probe SHALL run for every discovered bridge, bypassing the 30-second positive-result cache

#### Scenario: A bridge without a cheap session action is not polled

- **GIVEN** a discovered bridge whose only session action is expensive
- **WHEN** the polling interval fires
- **THEN** no message SHALL be sent to that bridge and it SHALL be reported as discovered with no session
