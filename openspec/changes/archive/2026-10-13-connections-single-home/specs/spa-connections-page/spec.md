## ADDED Requirements

### Requirement: The page states whose connections they are and where they live

The page SHALL open by naming the athlete the connections belong to and by
stating that they are kept in this browser only and do not sync to the
reader's other devices, because the connection records are device-local while
almost everything else the athlete owns syncs.

Beside that statement the page SHALL count the connected sources over every
card it renders — extensions and credential-based sources alike — using the
one rule for whether a source is connected, so the count cannot disagree with
the cards beneath it. A source that is detected, still being checked or in
need of attention SHALL count as connected; manual entry and brands that
cannot be connected SHALL NOT count. The count SHALL claim nothing until
discovery has had its window, under the same gate as the page's other
counters, unless a source is already connected.

#### Scenario: The scope names the athlete and the browser

- **GIVEN** an active athlete named Ana
- **WHEN** the Connections page renders
- **THEN** it SHALL state that these are Ana's connections in this browser, and that they do not sync to other devices

#### Scenario: A credential-based source is counted

- **GIVEN** discovery has settled, one extension source is connected and one credential-based source is connected
- **WHEN** the count renders
- **THEN** it SHALL state two connected

#### Scenario: Manual entry is never counted

- **GIVEN** discovery has settled and no source other than manual entry is available
- **WHEN** the count renders
- **THEN** it SHALL state that none are connected

#### Scenario: A cold load claims no count

- **GIVEN** discovery has just begun and no source is connected
- **WHEN** the count renders
- **THEN** it SHALL render no count

### Requirement: An account link saved on the athlete is shown and undone on its card

A coaching account linked to the athlete is stored on the profile and syncs
with it, unlike the rest of the page. The source's card SHALL state that link,
naming the external account, and SHALL say that it is saved with the athlete
rather than only in this browser. The card SHALL offer to undo the link, and
undoing it SHALL remove the entry from the profile's linked accounts.

The link SHALL be shown, and its undo offered, whether or not the source's
extension is present in this browser, because the link was possibly made on
another device and the profile manager no longer carries a place to remove it.
A new link SHALL be offered only where the source's extension is present and
serves planned sessions.

The confirmation of an undone link SHALL NOT name the external account.

#### Scenario: A linked account is stated on its card

- **GIVEN** the active athlete has a Train2Go account linked
- **WHEN** the Connections page renders the Train2Go card
- **THEN** the card SHALL name the linked account and state that the link is saved with the athlete

#### Scenario: Undoing a link removes it from the athlete

- **GIVEN** the active athlete has a Train2Go account linked
- **WHEN** the reader undoes the link from the card
- **THEN** the athlete's linked accounts SHALL no longer hold a Train2Go entry

#### Scenario: A link is shown without its extension

- **GIVEN** the active athlete has a Train2Go account linked and the Train2Go extension is absent from this browser
- **WHEN** the Train2Go card renders
- **THEN** the link and its undo SHALL still be shown, and no new link SHALL be offered

## MODIFIED Requirements

### Requirement: The retired connection surfaces resolve to the Connections page

The Connections page SHALL be the only surface that changes which sources are
linked and where each data type is read from. The routing matrix at
`/settings/data-hub`, the bridge table at `/settings/extensions`, the
Connections section of Settings, the Linked Accounts tab of the profile manager
and the Connections section on the Athlete page SHALL NOT exist alongside it.
Another surface MAY name the sources feeding the athlete, provided it offers no
control over them and leads to the Connections page.

The page SHALL live at `/connections`, outside Settings: what it holds belongs
to the athlete and to this browser, not to the application's preferences.

The retired paths `/settings/connections`, `/settings/extensions` and
`/settings/data-hub` SHALL resolve to `/connections` rather than falling
through to the Settings index: each was linked from the Settings index itself,
so all are in browser histories and bookmarks. The resolution SHALL replace its
history entry, so pressing Back from the Connections page does not return to the
retired path and bounce forward again. A section segment that is neither live
nor retired SHALL continue to resolve to the Settings index.

Neither retired path ever accepted a query string, so nothing is carried across
the resolution. Any surface that later needs a deep-linked sub-section of the
Connections page SHALL define it as a live `?section=` anchor rather than by
reviving a retired path.

The derivations the retired matrix was built on — the per-cell routing state and
the per-bridge sync freshness — SHALL survive its UI, because the assistant's
data-routing answers are computed from them. Retiring a surface SHALL NOT retire
a derivation that another consumer reads.

#### Scenario: A visitor arriving at a retired path lands on Connections

- **WHEN** a user opens `/settings/connections`, `/settings/extensions` or `/settings/data-hub`
- **THEN** the Connections page SHALL render and the address SHALL read `/connections`

#### Scenario: Back does not return to the retired path

- **GIVEN** a user who arrived at the Connections page through a retired path
- **WHEN** they navigate back
- **THEN** they SHALL reach whatever preceded the retired path, not the retired path itself

#### Scenario: An unknown section still falls back to the index

- **WHEN** a user opens a `/settings/<segment>` that is neither a live section nor a retired one
- **THEN** the Settings index SHALL render, and the Connections page SHALL NOT

#### Scenario: The Settings index stops offering the retired sections

- **WHEN** the Settings index is rendered
- **THEN** it SHALL NOT offer a Connections row, an Extensions row or a Data Hub row

#### Scenario: The Athlete page names its sources and leads to Connections

- **GIVEN** an active athlete profile fed by a source connected in this browser and by a coaching account linked on the profile
- **WHEN** the Athlete page renders its body
- **THEN** it SHALL name each of those sources once, inside a single link to `/connections`, and SHALL offer no control that connects, disconnects or reroutes a source

#### Scenario: The Athlete page leads to Connections with nothing connected

- **GIVEN** an active athlete profile with no connected source and no linked account
- **WHEN** the Athlete page renders its body
- **THEN** it SHALL still link to `/connections`, stating that nothing is connected yet

#### Scenario: The profile manager carries no account links

- **WHEN** the profile manager edits an athlete
- **THEN** it SHALL NOT offer a Linked Accounts tab

#### Scenario: The assistant still answers routing questions

- **GIVEN** the routing matrix UI has been retired
- **WHEN** the user asks the assistant where a data type comes from
- **THEN** the answer SHALL still be derived from the same routing derivation the retired matrix used, so retiring the surface changes no answer
