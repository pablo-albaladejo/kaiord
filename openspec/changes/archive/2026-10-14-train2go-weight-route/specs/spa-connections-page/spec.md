## ADDED Requirements

### Requirement: Train2Go is offered as a weight source and nothing more from read:body

The system SHALL narrow the routes `train2go-bridge` may serve to
`planned-session`, `training-zones` and `weight`. `read:body` spans every body
and wellness type, but Train2Go only reports the athlete's weight, so no other
`read:body` type SHALL be offered for it. When the extension announces
`read:body`, linking Train2Go SHALL seed its weight import route with the other
routes it feeds, the route SHALL be switchable from the weight row, and
Train2Go SHALL be offerable as the weight's source of truth.

#### Scenario: Weight is the only body type Train2Go is offered for

- **GIVEN** a Train2Go extension announcing `read:training-plan`, `read:training-zones` and `read:body`
- **WHEN** the routes it may serve are derived
- **THEN** `weight` SHALL be among them
- **AND** no other type whose import token is `read:body` SHALL be

#### Scenario: Linking seeds the weight route

- **GIVEN** a Train2Go extension announcing `read:body`
- **WHEN** the athlete links Train2Go
- **THEN** an enabled `weight · import · train2go-bridge` route SHALL be seeded alongside `planned-session` and `training-zones`

#### Scenario: Train2Go can be ranked first for weight

- **GIVEN** enabled weight import routes for Train2Go and another source, and a Train2Go extension announcing `read:body`
- **WHEN** the weight row's source-of-truth choices are derived under a ranking that puts Train2Go first
- **THEN** Train2Go SHALL be among the choices and SHALL be the current source of truth
