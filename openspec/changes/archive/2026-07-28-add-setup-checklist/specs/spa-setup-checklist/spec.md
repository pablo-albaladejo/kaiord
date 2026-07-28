## ADDED Requirements

### Requirement: The setup checklist derives every item from persisted state

The SPA SHALL present a four-item setup checklist whose items are each derived
from state the user already produced, and SHALL NOT derive any item from a
"tutorial seen" flag. The items SHALL be: creating a first workout, setting a
training threshold, connecting a source, and pushing a session to a device.
Every item SHALL be scoped to the active profile except where the underlying
record carries no profile, and the checklist SHALL produce no items at all
while no profile is active.

#### Scenario: A workout the profile owns ticks the first item

- **GIVEN** the active profile owns at least one row in the `workouts` table
- **WHEN** the checklist is derived
- **THEN** the "create your first workout" item SHALL be done

#### Scenario: Another profile's workout does not tick the first item

- **GIVEN** the only stored workout belongs to a different profile
- **WHEN** the checklist is derived
- **THEN** the "create your first workout" item SHALL NOT be done

#### Scenario: A connected connection record ticks the source item

- **GIVEN** a `connections` row for the active profile whose status is `connected`
- **WHEN** the checklist is derived
- **THEN** the "connect a source" item SHALL be done

#### Scenario: A disconnected connection record does not tick the source item

- **GIVEN** a `connections` row for the active profile whose status is `disconnected` and no discovered bridge
- **WHEN** the checklist is derived
- **THEN** the "connect a source" item SHALL NOT be done

#### Scenario: A discovered bridge ticks the source item

- **GIVEN** the bridge-discovery singleton knows at least one bridge
- **WHEN** the checklist is derived
- **THEN** the "connect a source" item SHALL be done, without any connection record being required

#### Scenario: A workout export ledger entry ticks the push item

- **GIVEN** an `exportLedger` entry whose `dataType` is `workout`
- **WHEN** the checklist is derived
- **THEN** the "push a session to your watch" item SHALL be done

### Requirement: The zones item is answered by a threshold, not by zone arrays

The "set your FTP and zones" item SHALL be derived from the presence of a
threshold value on any sport in the profile's `sportZones` — a functional
threshold power, a lactate-threshold heart rate, or a threshold pace. It SHALL
NOT be derived from the length or contents of any zone array, because every
profile is seeded with populated default power and heart-rate zones and would
otherwise tick the item before the user has entered anything.

#### Scenario: A fresh profile with default zones does not tick the item

- **GIVEN** a profile whose sport zones carry the seeded default power and heart-rate zone arrays and no threshold value
- **WHEN** the checklist is derived
- **THEN** the "set your FTP and zones" item SHALL NOT be done

#### Scenario: A functional threshold power ticks the item

- **GIVEN** a profile whose cycling thresholds carry an `ftp`
- **WHEN** the checklist is derived
- **THEN** the "set your FTP and zones" item SHALL be done

#### Scenario: A non-power threshold ticks the item

- **GIVEN** a profile whose only threshold is a swimming `thresholdPace`
- **WHEN** the checklist is derived
- **THEN** the "set your FTP and zones" item SHALL be done, because power is not defined for every sport

### Requirement: The checklist reads persisted state in a single live query

The checklist's Dexie-backed signals SHALL be read inside one live-query
callback rather than one query per item, so that a write to any of the
underlying tables re-fires a single subscription. The derived state SHALL
update without a reload when the user completes an item. While the query has
not yet resolved, and while no profile is active, the checklist SHALL report
itself as dismissed so that the card never renders and then disappears.

#### Scenario: Completing an item updates the checklist live

- **GIVEN** the checklist is rendered with the workout item not done
- **WHEN** a workout is written for the active profile
- **THEN** the item SHALL become done without a reload

#### Scenario: No active profile hides the checklist

- **GIVEN** no active profile is set
- **WHEN** the checklist is derived
- **THEN** it SHALL report itself as dismissed and no item SHALL be done

### Requirement: The checklist is a card, never a modal

The checklist SHALL render inline in the page flow as a dismissible card, and
SHALL NOT render as a modal, overlay or blocking dialog. It SHALL show its
title, a "N of M done" caption, a progress indicator exposing the item counts
to assistive technology, one row per item, and an explicit dismiss control.
Done rows SHALL be rendered as inert struck-through text; the first not-done
row SHALL be rendered as the next action, showing its hint and linking to the
surface on which it is completed.

#### Scenario: Progress is reported as items, not percent

- **GIVEN** two of the four items are done
- **WHEN** the card renders
- **THEN** the caption SHALL read "2 of 4 done" and the progress indicator SHALL report a current value of 2 out of a maximum of 4

#### Scenario: Only the first not-done item is the next action

- **GIVEN** the first two items are done and the last two are not
- **WHEN** the card renders
- **THEN** only the third item SHALL show its hint and its next-action affordance

#### Scenario: The next action links to where it is completed

- **GIVEN** the "create your first workout" item is the next action
- **WHEN** the card renders
- **THEN** its row SHALL link to the new-workout route, carrying the originating surface so that Back returns there

#### Scenario: A done row is not a link

- **GIVEN** the "create your first workout" item is done
- **WHEN** the card renders
- **THEN** the row SHALL NOT be a link

### Requirement: Dismissal persists per profile and completion is permanent

Dismissing the checklist SHALL write a flag onto the active profile's
`userPreferences` row, so the dismissal survives a reload and travels with the
profile rather than with one browser. The flag SHALL be an optional, unindexed
field that requires no Dexie schema version bump, and its absence SHALL read as
"not dismissed". Once every item is done the checklist SHALL hide itself
without requiring an explicit dismissal, and SHALL NOT write anything to do so.

#### Scenario: Dismissing writes the preference

- **GIVEN** the card is rendered
- **WHEN** the user activates the dismiss control
- **THEN** the active profile's `userPreferences` row SHALL record the checklist as dismissed

#### Scenario: A dismissed checklist stays hidden

- **GIVEN** the active profile's `userPreferences` row records the checklist as dismissed
- **WHEN** the page is loaded again
- **THEN** the card SHALL NOT render

#### Scenario: A completed checklist hides itself

- **GIVEN** all four items are done and the checklist was never dismissed
- **WHEN** the card renders
- **THEN** it SHALL render nothing

#### Scenario: A pre-existing preferences row stays valid

- **GIVEN** a `userPreferences` row written before this change, with no checklist field
- **WHEN** the checklist is derived
- **THEN** the checklist SHALL read as not dismissed and no migration SHALL be required

### Requirement: The checklist starts no background work

Deriving or rendering the checklist SHALL NOT start bridge connection polling,
SHALL NOT mount the bridge-connections bootstrap, and SHALL NOT perform any
network request. Source detection SHALL rely only on the bridge-discovery
snapshot the application already maintains and on stored connection records.

#### Scenario: Visiting the page starts no polling

- **GIVEN** the checklist is rendered on the daily page
- **WHEN** it derives the "connect a source" item
- **THEN** no bridge connection polling SHALL be started

#### Scenario: An unreachable source still counts as connected

- **GIVEN** a stored connection record whose status is `connected` but whose provider session is no longer live
- **WHEN** the checklist is derived
- **THEN** the "connect a source" item SHALL be done, because the item asks whether a source was ever connected
