> Synced: 2026-08-04 (retire-help-dialog-for-coach-marks)

# SPA Coach Marks

## Purpose

In-app guidance that points at the element it teaches about. Defines how a
mark resolves its anchor through the focus registry, when it is allowed to
fire (only while the command it teaches is already available), and how it is
retired per profile once acted on — together with the retirement of the
long-form in-app help those marks replaced, which duplicated the docs site and
blocked the surface it described.

## Requirements

### Requirement: A coach mark points at a real element or does not render

The SPA SHALL resolve every coach mark's anchor through the focus registry that
already maps item ids to mounted elements, and SHALL NOT resolve it by querying
the document for a selector. A mark whose anchor is not registered SHALL NOT be
offered, and a mark whose position has not been computed from the anchor's and
its own measured rectangles SHALL NOT be visible. There SHALL be no fixed,
viewport-relative or centred fallback placement.

#### Scenario: A registered anchor resolves to its element

- **GIVEN** a card has registered itself under the id a coach mark targets
- **WHEN** the mark's anchor is resolved
- **THEN** it SHALL be the exact element that card registered

#### Scenario: An unregistered anchor yields no element

- **GIVEN** no card is registered under the id a coach mark targets
- **WHEN** the mark's anchor is resolved
- **THEN** it SHALL resolve to nothing, and the mark SHALL report itself as unanchored

#### Scenario: A mark with no anchor id is never selected

- **GIVEN** a coach mark whose command is available but whose anchor id is absent
- **WHEN** the relevant mark is chosen
- **THEN** no mark SHALL be chosen

#### Scenario: An unanchored mark is not shown centred

- **GIVEN** a coach mark is relevant but its anchor is not in the registry
- **WHEN** the mark renders
- **THEN** it SHALL NOT be visible and SHALL NOT be placed at the centre of the viewport

#### Scenario: The anchor is brought into view

- **GIVEN** a coach mark's anchor resolves to an element
- **WHEN** the mark becomes relevant
- **THEN** the anchor SHALL be scrolled into view

### Requirement: Coach marks are placed by the shared tooltip geometry

Coach-mark placement SHALL be computed from the anchor's and the mark's
measured rectangles using the same positioning function the tooltip component
uses, so that a mark and a tooltip on the same element with the same side and
alignment resolve to the same coordinates. Placement SHALL be recomputed when
the viewport resizes and when any ancestor scrolls, including a scroll on a
nested container that does not bubble to the window.

#### Scenario: A mark and a tooltip on one anchor agree

- **GIVEN** an anchor rectangle, a mark rectangle, a side and an alignment
- **WHEN** the mark's position is computed
- **THEN** it SHALL equal the position the tooltip geometry produces for the same inputs

#### Scenario: Placement follows a resize

- **GIVEN** an anchored coach mark
- **WHEN** the window resizes and the anchor's rectangle changes
- **THEN** the mark's position SHALL be recomputed

#### Scenario: Placement follows a nested scroll

- **GIVEN** an anchored coach mark inside a scrollable container
- **WHEN** that container emits a non-bubbling scroll event
- **THEN** the mark's position SHALL be recomputed

### Requirement: A coach mark fires from an existing command guard

A coach mark SHALL be offered only while the editor command it teaches is
itself available, using that command's own guard rather than a predicate
written for the mark. Its primary action SHALL invoke that command, and SHALL
NOT re-implement the underlying store action. At most one mark SHALL be offered
at a time, chosen in a fixed catalog order. A mark's identity SHALL also be the
identity of the shortcut-catalog row that documents it, so the keys the mark
teaches cannot drift from the keys the application binds.

#### Scenario: The grouping mark waits for a groupable selection

- **GIVEN** fewer than two steps are selected
- **WHEN** the relevant mark is chosen
- **THEN** the grouping mark SHALL NOT be offered

#### Scenario: A multi-selection makes the grouping mark relevant

- **GIVEN** two steps are selected
- **WHEN** the relevant mark is chosen
- **THEN** the grouping mark SHALL be offered, anchored to the most recently selected step

#### Scenario: A selected block makes the ungrouping mark relevant

- **GIVEN** a repetition block is the selected item
- **WHEN** the relevant mark is chosen
- **THEN** the ungrouping mark SHALL be offered, anchored to that block

#### Scenario: Accepting a mark runs its command

- **GIVEN** the grouping mark is offered
- **WHEN** the user accepts it
- **THEN** the same action the grouping shortcut performs SHALL be invoked

#### Scenario: Every mark documents a real binding

- **GIVEN** the coach-mark catalog
- **WHEN** each mark id is looked up in the shortcut catalog
- **THEN** a row SHALL exist for it

### Requirement: A coach mark is retired per profile once acted on

Accepting or waving away a coach mark SHALL record that mark's id on the active
profile's preferences row, and a recorded mark SHALL NOT be offered again. The
record SHALL be an optional, unindexed field requiring no schema version bump,
its absence SHALL read as "nothing dismissed", and it SHALL travel with the
profile rather than with one browser. Retiring one mark SHALL NOT retire any
other.

#### Scenario: Waving a mark away records it

- **GIVEN** a coach mark is offered
- **WHEN** the user waves it away
- **THEN** the active profile's preferences row SHALL record that mark's id

#### Scenario: Accepting a mark also records it

- **GIVEN** a coach mark is offered
- **WHEN** the user accepts it
- **THEN** the active profile's preferences row SHALL record that mark's id

#### Scenario: A recorded mark stays silent

- **GIVEN** the active profile's preferences row records the grouping mark
- **WHEN** two steps are selected
- **THEN** no grouping mark SHALL be offered

#### Scenario: A pre-existing preferences row stays valid

- **GIVEN** a preferences row written before this change, with no coach-mark field
- **WHEN** the relevant mark is chosen
- **THEN** no mark SHALL be treated as dismissed and no migration SHALL be required

### Requirement: Long-form help does not ship inside the application

The application SHALL NOT ship an in-app copy of the long-form documentation —
getting-started walkthroughs, example workouts or a frequently-asked-questions
list — and SHALL NOT ship a modal help dialog or a first-run step-by-step
tutorial. The header SHALL NOT offer a help entry point. In-app guidance SHALL
be limited to the shortcut sheet, the command palette, the setup checklist and
coach marks; long-form content SHALL live only on the documentation site,
reachable from Settings. Translation catalogs SHALL retain only the keys a
surviving surface resolves.

#### Scenario: No help dialog is reachable from the header

- **GIVEN** the application header is rendered
- **WHEN** its controls are enumerated
- **THEN** no help entry point SHALL be present and no help dialog SHALL be mountable from it

#### Scenario: No tutorial runs on first visit

- **GIVEN** a browser with no stored application state
- **WHEN** the application is loaded
- **THEN** no tutorial dialog SHALL be presented

#### Scenario: Retired copy is removed from every locale

- **GIVEN** the help translation namespace
- **WHEN** its keys are enumerated in any supported locale
- **THEN** only keys resolved by the shortcut catalog and the shortcut sheet SHALL remain

#### Scenario: The documentation link lives in Settings

- **GIVEN** the Settings index
- **WHEN** its About group is rendered
- **THEN** it SHALL offer an external link to the documentation site

### Requirement: Retired coach marks can be re-armed from Settings

Settings SHALL offer a control that clears every recorded coach-mark dismissal
for the active profile, so a user who waved a tip away can see it again. The
control SHALL act in place rather than navigating, and SHALL NOT be described
as replaying a tutorial, because no ordered tutorial exists to replay.

#### Scenario: The control clears the recorded dismissals

- **GIVEN** the active profile has recorded coach-mark dismissals
- **WHEN** the user activates the Settings control
- **THEN** the recorded dismissals SHALL be emptied and the marks SHALL be eligible again

#### Scenario: The control does not navigate

- **GIVEN** the Settings index is rendered
- **WHEN** the control is activated
- **THEN** it SHALL run in place and SHALL NOT change the route
