# Requirements Document

## Introduction

This feature enables bidirectional conversion between Garmin FIT workout files and the Kaiord Representation Definition (KRD) format. Users can convert FIT files to KRD for editing and validation, then convert back to FIT for use with fitness devices and platforms. FIT files contain structured workout data including workout steps, durations, targets (power, heart rate, cadence, pace), and repetitions. The conversion must preserve all workout structure and training targets in both directions, ensuring round-trip safety (FIT → KRD → FIT and KRD → FIT → KRD) within defined tolerances. This capability is essential for users who want to edit, validate, and re-export workout files consistently across different fitness platforms.

## Workout Types

The conversion must support the following primary workout types:

- **Power-based workouts** (cycling and running): Intervals defined by power targets (watts or %FTP)
- **Pace-based workouts** (running): Intervals defined by pace targets (speed in m/s)
- **Heart rate-based workouts** (cycling and running): Intervals defined by HR zones or specific bpm targets

Within each workout, intervals can have durations specified by:

- **Time-based duration**: Interval length in seconds
- **Distance-based duration**: Interval length in meters

## Glossary

- **FIT_Parser**: The component responsible for reading and decoding binary FIT workout files using the Garmin FIT JavaScript SDK
- **FIT_Writer**: The component responsible for encoding KRD workout data into binary FIT format using the Garmin FIT JavaScript SDK
- **Garmin_FIT_SDK**: The official Garmin FIT JavaScript SDK library (@garmin/fitsdk) used for parsing and encoding FIT files
- **KRD_Converter**: The component that transforms parsed FIT workout data into KRD format
- **FIT_Converter**: The component that transforms KRD workout data into FIT format
- **Workout_Step**: A single training interval within a workout, containing duration and target specifications
- **Duration_Spec**: The specification for how long a workout step lasts (time-based in seconds or distance-based in meters)
- **Target_Spec**: The training target for a workout step (power in watts, heart rate in bpm, cadence in rpm, or pace in m/s)
- **Power_Target**: A target specified in absolute watts or as percentage of FTP for cycling and running
- **Pace_Target**: A target specified as speed in meters per second for running workouts
- **HR_Target**: A target specified in beats per minute or as a heart rate zone
- **Repetition_Block**: A group of workout steps that repeat a specified number of times
- **Schema_Validator**: The component that validates KRD output against the JSON schema
- **Tolerance_Checker**: The component that verifies conversion accuracy within acceptable tolerances
- **Round_Trip_Validator**: The component that validates FIT → KRD → FIT conversions preserve data within tolerances

## Requirements

### Requirement 1

**User Story:** As a cyclist or runner, I want to convert FIT workout files to KRD format, so that I can edit workout structures in a human-readable format and validate them against a standard schema.

#### Acceptance Criteria

1. WHEN THE FIT_Parser receives a valid FIT workout file, THE FIT_Parser SHALL use the Garmin_FIT_SDK to decode the binary data into structured workout objects
2. WHEN THE KRD_Converter processes decoded FIT workout data, THE KRD_Converter SHALL produce a KRD document with version set to "1.0"
3. WHEN THE Schema_Validator validates KRD output, THE Schema_Validator SHALL use the Zod schema as the source of truth
4. WHEN THE build process runs, THE build system SHALL automatically generate workout.json from the Zod schema
5. IF THE Schema_Validator detects validation errors, THEN THE KRD_Converter SHALL report the specific validation failures with actionable error messages
6. WHEN THE KRD_Converter writes the output file, THE KRD_Converter SHALL use the .krd file extension

### Requirement 2

**User Story:** As a cyclist or runner, I want workout step durations to be accurately converted, so that my training intervals maintain their intended length.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters a time-based duration in FIT data, THE KRD_Converter SHALL convert the duration to seconds as a numeric value
2. WHEN THE KRD_Converter encounters a distance-based duration in FIT data, THE KRD_Converter SHALL convert the duration to meters as a numeric value
3. WHEN THE Tolerance_Checker validates time-based durations, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 second
4. WHEN THE Tolerance_Checker validates distance-based durations, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 meter
5. WHEN THE KRD_Converter processes open-ended durations, THE KRD_Converter SHALL represent them with a null value or appropriate marker

### Requirement 3

**User Story:** As a cyclist, I want power targets to be precisely converted, so that I receive accurate training intensity prescriptions for my cycling workouts.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters absolute power targets in FIT data, THE KRD_Converter SHALL convert the power value to watts as a numeric value
2. WHEN THE KRD_Converter encounters FTP-based power targets in FIT data, THE KRD_Converter SHALL preserve the percentage relationship to FTP
3. WHEN THE KRD_Converter processes WorkoutCustomTargetValues.fit, THE KRD_Converter SHALL accurately convert all custom power zone targets
4. WHEN THE Tolerance_Checker validates absolute power targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 watt
5. WHEN THE Tolerance_Checker validates FTP-based power targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 percent of FTP

### Requirement 4

**User Story:** As a cyclist or runner, I want heart rate targets to be accurately converted, so that I train in the correct cardiovascular zones for both cycling and running workouts.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters absolute heart rate targets in FIT data, THE KRD_Converter SHALL convert the heart rate value to beats per minute as an integer
2. WHEN THE KRD_Converter processes WorkoutCustomTargetValues.fit, THE KRD_Converter SHALL accurately convert all custom heart rate zone targets
3. WHEN THE Tolerance_Checker validates heart rate targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 beat per minute
4. WHEN THE KRD_Converter encounters heart rate range targets, THE KRD_Converter SHALL preserve both minimum and maximum heart rate values
5. WHEN THE KRD_Converter encounters percentage-based heart rate targets, THE KRD_Converter SHALL preserve the percentage relationship to maximum heart rate

### Requirement 5

**User Story:** As a cyclist, I want cadence targets to be accurately converted, so that I maintain proper pedaling efficiency during cycling workouts.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters cadence targets in FIT cycling data, THE KRD_Converter SHALL convert the cadence value to revolutions per minute as a numeric value
2. WHEN THE Tolerance_Checker validates cadence targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 revolution per minute
3. WHEN THE KRD_Converter encounters cadence range targets, THE KRD_Converter SHALL preserve both minimum and maximum cadence values
4. WHILE processing running workouts, THE KRD_Converter SHALL convert steps per minute to revolutions per minute by dividing by 2
5. WHEN THE KRD_Converter encounters open cadence targets, THE KRD_Converter SHALL represent them appropriately in the KRD format

### Requirement 5.1

**User Story:** As a runner, I want pace targets to be accurately converted, so that I maintain the correct running speed during pace-based workouts.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters pace targets in FIT running data, THE KRD_Converter SHALL convert the pace value to meters per second as a numeric value
2. WHEN THE KRD_Converter processes WorkoutCustomTargetValues.fit with pace targets, THE KRD_Converter SHALL accurately convert all custom pace zone targets
3. WHEN THE Tolerance_Checker validates pace targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 0.01 meters per second
4. WHEN THE KRD_Converter encounters pace range targets, THE KRD_Converter SHALL preserve both minimum and maximum pace values
5. WHEN THE KRD_Converter encounters speed-based targets in FIT data, THE KRD_Converter SHALL convert them to pace values in meters per second

### Requirement 6

**User Story:** As a workout designer, I want workout step order to be preserved exactly, so that the training progression follows the intended sequence.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes multiple workout steps, THE KRD_Converter SHALL maintain the original step order from the FIT file
2. WHEN THE KRD_Converter encounters nested workout steps, THE KRD_Converter SHALL preserve the hierarchical structure
3. WHEN THE Schema_Validator checks step ordering, THE Schema_Validator SHALL verify that step indices are sequential
4. WHEN THE KRD_Converter processes warmup and cooldown steps, THE KRD_Converter SHALL position them at the beginning and end respectively
5. WHEN THE KRD_Converter processes WorkoutIndividualSteps.fit, THE KRD_Converter SHALL produce a KRD document with steps in the exact order they appear in the FIT file

### Requirement 7

**User Story:** As an interval training enthusiast, I want repetition blocks to be accurately converted, so that my repeated intervals are executed the correct number of times.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters a repetition block in FIT data, THE KRD_Converter SHALL preserve the repetition count as an integer
2. WHEN THE KRD_Converter processes steps within a repetition block, THE KRD_Converter SHALL group them under the repetition structure
3. WHEN THE KRD_Converter processes WorkoutRepeatGreaterThanStep.fit, THE KRD_Converter SHALL correctly handle cases where repetition count exceeds the number of steps
4. WHEN THE KRD_Converter processes WorkoutRepeatSteps.fit, THE KRD_Converter SHALL produce a KRD document with correctly structured repetition blocks
5. WHEN THE Tolerance_Checker validates repetition counts, THE Tolerance_Checker SHALL verify exact integer matching

### Requirement 8

**User Story:** As a cyclist or runner, I want workout metadata to be fully captured, so that I can track workout origin, creation date, and sport type for both cycling and running workouts.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes FIT file metadata, THE KRD_Converter SHALL extract the creation timestamp in ISO 8601 format
2. WHEN THE KRD_Converter encounters manufacturer information, THE KRD_Converter SHALL populate the manufacturer field in KRD metadata
3. WHEN THE KRD_Converter encounters sport type information for cycling or running, THE KRD_Converter SHALL map the FIT sport type to the KRD sport field
4. WHEN THE KRD_Converter encounters product information, THE KRD_Converter SHALL populate the product field in KRD metadata
5. WHERE serial number information exists in FIT data, THE KRD_Converter SHALL include it in the KRD metadata

### Requirement 9

**User Story:** As a quality assurance engineer, I want conversion errors to be clearly reported, so that I can quickly identify and fix data issues.

#### Acceptance Criteria

1. IF THE Garmin_FIT_SDK encounters a corrupted FIT file during parsing, THEN THE FIT_Parser SHALL report a descriptive error message indicating the corruption location
2. IF THE KRD_Converter encounters unsupported FIT message types, THEN THE KRD_Converter SHALL log a warning and continue processing
3. IF THE Schema_Validator detects validation failures, THEN THE Schema_Validator SHALL report all validation errors with field paths and expected values
4. IF THE Tolerance_Checker detects values outside acceptable tolerances, THEN THE Tolerance_Checker SHALL report the specific field and deviation amount
5. WHEN THE KRD_Converter encounters missing required fields, THE KRD_Converter SHALL report which fields are missing and halt conversion

### Requirement 10

**User Story:** As a fitness platform integrator, I want FIT-specific extensions to be preserved, so that no data is lost during conversion.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters FIT developer fields, THE KRD_Converter SHALL store them in the extensions.fit object
2. WHEN THE KRD_Converter encounters unknown FIT message types, THE KRD_Converter SHALL preserve them in the extensions.fit object
3. WHEN THE KRD_Converter processes custom FIT data fields, THE KRD_Converter SHALL maintain field names and values in extensions
4. WHEN THE Schema_Validator validates the KRD document, THE Schema_Validator SHALL allow arbitrary data in the extensions object
5. WHEN THE KRD_Converter writes extension data, THE KRD_Converter SHALL ensure the data is valid JSON

### Requirement 11

**User Story:** As a cyclist or runner, I want to convert KRD workout files back to FIT format, so that I can use edited workouts on my Garmin device.

#### Acceptance Criteria

1. WHEN THE FIT_Converter receives a valid KRD workout file, THE FIT_Converter SHALL validate it against the workout.json schema before conversion
2. WHEN THE FIT_Writer encodes KRD workout data, THE FIT_Writer SHALL use the Garmin_FIT_SDK to produce a valid binary FIT file
3. WHEN THE FIT_Converter processes workout steps from KRD, THE FIT_Converter SHALL maintain the original step order in the FIT output
4. WHEN THE FIT_Converter processes repetition blocks from KRD, THE FIT_Converter SHALL encode them correctly in FIT format
5. WHEN THE FIT_Writer completes encoding, THE FIT_Writer SHALL produce a FIT file that can be parsed by the Garmin_FIT_SDK

### Requirement 12

**User Story:** As a workout designer, I want duration specifications to be accurately converted from KRD to FIT, so that interval lengths are preserved.

#### Acceptance Criteria

1. WHEN THE FIT_Converter encounters time-based durations in KRD data, THE FIT_Converter SHALL convert seconds to the appropriate FIT time format
2. WHEN THE FIT_Converter encounters distance-based durations in KRD data, THE FIT_Converter SHALL convert meters to the appropriate FIT distance format
3. WHEN THE Tolerance_Checker validates KRD to FIT time conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 second
4. WHEN THE Tolerance_Checker validates KRD to FIT distance conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 meter
5. WHEN THE FIT_Converter encounters null or open-ended durations in KRD, THE FIT_Converter SHALL encode them appropriately in FIT format

### Requirement 13

**User Story:** As a cyclist, I want power targets to be accurately converted from KRD to FIT, so that my training intensity is preserved.

#### Acceptance Criteria

1. WHEN THE FIT_Converter encounters absolute power targets in KRD data, THE FIT_Converter SHALL convert watts to the appropriate FIT power format
2. WHEN THE FIT_Converter encounters FTP-based power targets in KRD data, THE FIT_Converter SHALL preserve the percentage relationship in FIT format
3. WHEN THE FIT_Converter encounters power zone targets in KRD data, THE FIT_Converter SHALL encode the zone identifier in FIT format
4. WHEN THE Tolerance_Checker validates KRD to FIT power conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 watt
5. WHEN THE Tolerance_Checker validates KRD to FIT FTP-based conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 percent of FTP

### Requirement 14

**User Story:** As a cyclist or runner, I want heart rate and pace targets to be accurately converted from KRD to FIT, so that my training zones are preserved.

#### Acceptance Criteria

1. WHEN THE FIT_Converter encounters heart rate targets in KRD data, THE FIT_Converter SHALL convert bpm values to the appropriate FIT heart rate format
2. WHEN THE FIT_Converter encounters pace targets in KRD data, THE FIT_Converter SHALL convert meters per second to the appropriate FIT speed format
3. WHEN THE Tolerance_Checker validates KRD to FIT heart rate conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 beat per minute
4. WHEN THE Tolerance_Checker validates KRD to FIT pace conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 0.01 meters per second
5. WHEN THE FIT_Converter encounters cadence targets in KRD data, THE FIT_Converter SHALL convert rpm values to the appropriate FIT cadence format

### Requirement 15

**User Story:** As a quality assurance engineer, I want round-trip conversion to be validated in both directions, so that I can verify data integrity across FIT → KRD → FIT and KRD → FIT → KRD transformations.

#### Acceptance Criteria

1. WHEN THE Round_Trip_Validator processes WorkoutIndividualSteps.fit, THE Round_Trip_Validator SHALL verify that FIT → KRD → FIT produces equivalent workout steps within tolerances
2. WHEN THE Round_Trip_Validator processes WorkoutRepeatSteps.fit, THE Round_Trip_Validator SHALL verify that repetition blocks are preserved in FIT → KRD → FIT within tolerances
3. WHEN THE Round_Trip_Validator processes WorkoutRepeatGreaterThanStep.fit, THE Round_Trip_Validator SHALL verify that nested structures are preserved in FIT → KRD → FIT within tolerances
4. WHEN THE Round_Trip_Validator processes WorkoutCustomTargetValues.fit, THE Round_Trip_Validator SHALL verify that all target values are preserved in FIT → KRD → FIT within defined tolerances
5. WHEN THE Round_Trip_Validator processes a KRD workout file, THE Round_Trip_Validator SHALL verify that KRD → FIT → KRD produces equivalent workout data within tolerances
6. WHEN THE Round_Trip_Validator detects deviations exceeding tolerances in either direction, THE Round_Trip_Validator SHALL report the specific fields and deviation amounts

### Requirement 16

**User Story:** As a workout designer, I want to combine different interval types and training targets within a single workout, so that I can create complex training sessions with varied objectives.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes a workout with mixed duration types, THE KRD_Converter SHALL correctly convert both time-based and distance-based intervals within the same workout
2. WHEN THE KRD_Converter processes a workout with mixed target types, THE KRD_Converter SHALL correctly convert power, heart rate, cadence, and pace targets within the same workout
3. WHEN THE FIT_Converter processes a KRD workout with mixed interval types, THE FIT_Converter SHALL correctly encode all duration types in the FIT output
4. WHEN THE FIT_Converter processes a KRD workout with mixed target types, THE FIT_Converter SHALL correctly encode all target types in the FIT output
5. WHEN THE Round_Trip_Validator processes a workout with any combination of interval durations and training targets, THE Round_Trip_Validator SHALL verify that all combinations are preserved within tolerances

### Requirement 17

**User Story:** As a developer, I want test fixture files available in the repository, so that I can implement and validate conversion tests consistently.

#### Acceptance Criteria

1. WHEN THE development environment is set up, THE repository SHALL contain WorkoutCustomTargetValues.fit in the test fixtures directory
2. WHEN THE development environment is set up, THE repository SHALL contain WorkoutIndividualSteps.fit in the test fixtures directory
3. WHEN THE development environment is set up, THE repository SHALL contain WorkoutRepeatGreaterThanStep.fit in the test fixtures directory
4. WHEN THE development environment is set up, THE repository SHALL contain WorkoutRepeatSteps.fit in the test fixtures directory
5. WHEN THE test suite runs, THE test framework SHALL have access to all fixture files for golden file testing and round-trip validation
