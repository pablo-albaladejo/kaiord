## ADDED Requirements

### Requirement: The retired connection surfaces resolve to the Connections page

The Connections page SHALL be the only surface that displays or changes which
sources are linked and where each data type is read from. The routing matrix at
`/settings/data-hub`, the bridge table at `/settings/extensions` and the
Connections section on the Athlete page SHALL NOT exist alongside it.

Both retired paths SHALL resolve to `/settings/connections` rather than falling
through to the Settings index: each was linked from the Settings index itself,
so both are in browser histories and bookmarks. The resolution SHALL replace its
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

- **WHEN** a user opens `/settings/extensions` or `/settings/data-hub`
- **THEN** the Connections page SHALL render and the address SHALL read `/settings/connections`

#### Scenario: Back does not return to the retired path

- **GIVEN** a user who arrived at the Connections page through a retired path
- **WHEN** they navigate back
- **THEN** they SHALL reach whatever preceded the retired path, not the retired path itself

#### Scenario: An unknown section still falls back to the index

- **WHEN** a user opens a `/settings/<segment>` that is neither a live section nor a retired one
- **THEN** the Settings index SHALL render, and the Connections page SHALL NOT

#### Scenario: The Settings index stops offering the retired sections

- **WHEN** the Settings index is rendered
- **THEN** it SHALL offer a Connections row and SHALL NOT offer an Extensions row or a Data Hub row

#### Scenario: The Athlete page carries no connection state

- **GIVEN** an active athlete profile
- **WHEN** the Athlete page renders its body
- **THEN** it SHALL show identity, thresholds and zones only, and SHALL NOT present any source's connection state

#### Scenario: The assistant still answers routing questions

- **GIVEN** the routing matrix UI has been retired
- **WHEN** the user asks the assistant where a data type comes from
- **THEN** the answer SHALL still be derived from the same routing derivation the retired matrix used, so retiring the surface changes no answer

### Requirement: The Tanita export is offered once, from the source it reads

The manual Tanita → Garmin body-composition push SHALL be offered from exactly
one control, on the card of the source whose data it reads. A second copy on the
receiving source's card would own an independent copy of the transfer's state,
and both cards can be expanded at the same time, so the same upload could be
started twice with nothing downstream collapsing the duplicate push or its
export-ledger row.

The control SHALL remain gated on both bridges being present, so it is disabled
rather than failing part-way when the receiving bridge is absent. The receiving
source's card SHALL continue to name the route among what Kaiord sends back to
it, so retiring the second control does not hide that the route exists.

#### Scenario: The push is offered from the reading source

- **GIVEN** both bridges are present and the reading source's card is expanded
- **WHEN** the user looks for the body-composition push
- **THEN** exactly one control SHALL offer it, on that card

#### Scenario: The receiving source still names the route

- **WHEN** the receiving source's card is expanded
- **THEN** body composition SHALL appear among what Kaiord sends back to it

#### Scenario: The push is disabled without the receiving bridge

- **GIVEN** the reading source is present and the receiving bridge is not
- **WHEN** the control is rendered
- **THEN** it SHALL be disabled, rather than starting a transfer it cannot finish
