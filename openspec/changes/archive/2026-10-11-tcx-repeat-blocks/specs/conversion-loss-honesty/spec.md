## ADDED Requirements

### Requirement: The SPA SHALL show the user that an import was lossy

When the SPA imports a TCX file, every warning the reader logs SHALL be collected, and an import that completes with at least one warning SHALL show an "Imported with warnings" toast, from both the editor's import overlay and the converter page. A warning SHALL NOT be reported only to the browser console.

#### Scenario: A step the reader had to skip

- **GIVEN** a TCX workout with a step whose duration the reader cannot convert
- **WHEN** the user imports it from the editor
- **THEN** the workout loads without that step
- **AND** an "Imported with warnings" toast is shown

#### Scenario: A clean import

- **WHEN** the user imports `WorkoutRepeatBlocks.tcx`
- **THEN** no warning toast is shown
