# Requirements Document

## Introduction

This feature enables bidirectional conversion between Training Center XML (TCX) workout files and the Kaiord Representation Definition (KRD) format. TCX is an XML-based format developed by Garmin for storing structured workout data, widely used across fitness platforms including TrainingPeaks, Strava, and Garmin Connect.

**TCX Schema Reference**: [Garmin Training Center Database v2 XSD](https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd) Users can convert TCX files to KRD for editing and validation, then convert back to TCX for use with fitness devices and platforms. TCX files contain structured workout data including workout steps, durations, targets (heart rate, speed, cadence), and repetitions. The conversion must preserve all workout structure and training targets in both directions, ensuring round-trip safety (TCX → KRD → TCX and KRD → TCX → KRD) within defined tolerances. This capability is essential for users who want to edit, validate, and re-export workout files consistently across different fitness platforms.

## Workout Types

The conversion must support the following primary workout types:

- **Heart rate-based workouts**: Intervals defined by HR zones or specific bpm targets
- **Speed-based workouts** (running/cycling): Intervals defined by speed targets (m/s)
- **Cadence-based workouts**: Intervals defined by cadence targets (rpm or spm)
- **Power-based workouts** (cycling): Intervals defined by power targets (watts) via extensions

Within each workout, intervals can have durations specified by:

- **Time-based duration**: Interval length in seconds
- **Distance-based duration**: Interval length in meters
- **Lap button**: Manual lap trigger (open duration)

## Glossary

- **TCX_Parser**: The component responsible for reading and parsing XML TCX workout files
- **TCX_Writer**: The component responsible for encoding KRD workout data into XML TCX format
- **XML_Parser**: The XML parsing library used for reading TCX files (e.g., fast-xml-parser)
- **XML_Builder**: The XML building library used for writing TCX files (e.g., fast-xml-parser)
- **KRD_Converter**: The component that transforms parsed TCX workout data into KRD format
- **TCX_Converter**: The component that transforms KRD workout data into TCX format
- **Workout_Step**: A single training interval within a workout, containing duration and target specifications
- **Duration_Spec**: The specification for how long a workout step lasts (time-based in seconds, distance-based in meters, or lap button)
- **Target_Spec**: The training target for a workout step (heart rate in bpm/zones, speed in m/s, cadence in rpm, or power in watts via extensions)
- **HR_Target**: A target specified in beats per minute or as a heart rate zone
- **Speed_Target**: A target specified as speed in meters per second
- **Cadence_Target**: A target specified in revolutions per minute (cycling) or steps per minute (running)
- **Power_Target**: A target specified in watts via TCX extensions (non-standard)
- **Repetition_Block**: A group of workout steps that repeat a specified number of times
- **Schema_Validator**: The component that validates KRD output against the JSON schema
- **Tolerance_Checker**: The component that verifies conversion accuracy within acceptable tolerances
- **Round_Trip_Validator**: The component that validates TCX → KRD → TCX conversions preserve data within tolerances

## Requirements

### Requirement 1

**User Story:** As a fitness enthusiast, I want to convert TCX workout files to KRD format, so that I can edit workout structures in a human-readable format and validate them against a standard schema.

#### Acceptance Criteria

1. WHEN THE TCX_Parser receives a valid TCX workout file, THE TCX_Parser SHALL use the XML_Parser to decode the XML data into structured workout objects
2. WHEN THE KRD_Converter processes decoded TCX workout data, THE KRD_Converter SHALL produce a KRD document with version set to "1.0"
3. WHEN THE Schema_Validator validates KRD output, THE Schema_Validator SHALL use the Zod schema as the source of truth
4. IF THE Schema_Validator detects validation errors, THEN THE KRD_Converter SHALL report the specific validation failures with actionable error messages
5. WHEN THE KRD_Converter writes the output file, THE KRD_Converter SHALL use the .krd file extension

### Requirement 2

**User Story:** As a fitness enthusiast, I want workout step durations to be accurately converted, so that my training intervals maintain their intended length.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters a time-based duration in TCX data, THE KRD_Converter SHALL convert the duration to seconds as a numeric value
2. WHEN THE KRD_Converter encounters a distance-based duration in TCX data, THE KRD_Converter SHALL convert the duration to meters as a numeric value
3. WHEN THE Tolerance_Checker validates time-based durations, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 second
4. WHEN THE Tolerance_Checker validates distance-based durations, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 meter
5. WHEN THE KRD_Converter processes lap button durations, THE KRD_Converter SHALL represent them with type "open"

### Requirement 3

**User Story:** As a fitness enthusiast, I want heart rate targets to be accurately converted, so that I train in the correct cardiovascular zones.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters absolute heart rate targets in TCX data, THE KRD_Converter SHALL convert the heart rate value to beats per minute as an integer
2. WHEN THE KRD_Converter encounters heart rate zone targets in TCX data, THE KRD_Converter SHALL preserve the zone identifier (1-5)
3. WHEN THE Tolerance_Checker validates heart rate targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 beat per minute
4. WHEN THE KRD_Converter encounters heart rate range targets, THE KRD_Converter SHALL preserve both minimum and maximum heart rate values
5. WHEN THE KRD_Converter encounters percentage-based heart rate targets, THE KRD_Converter SHALL preserve the percentage relationship to maximum heart rate

### Requirement 4

**User Story:** As a runner or cyclist, I want speed targets to be accurately converted, so that I maintain the correct pace during workouts.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters speed targets in TCX data, THE KRD_Converter SHALL convert the speed value to meters per second as a numeric value
2. WHEN THE Tolerance_Checker validates speed targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 0.01 meters per second
3. WHEN THE KRD_Converter encounters speed range targets, THE KRD_Converter SHALL preserve both minimum and maximum speed values
4. WHEN THE KRD_Converter encounters pace zones in TCX data, THE KRD_Converter SHALL convert them to speed values in meters per second
5. WHEN THE TCX_Converter processes KRD pace targets, THE TCX_Converter SHALL convert meters per second to TCX speed format

### Requirement 5

**User Story:** As a cyclist or runner, I want cadence targets to be accurately converted, so that I maintain proper pedaling or running efficiency.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters cadence targets in TCX data, THE KRD_Converter SHALL convert the cadence value to revolutions per minute as a numeric value
2. WHEN THE Tolerance_Checker validates cadence targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 revolution per minute
3. WHEN THE KRD_Converter encounters cadence range targets, THE KRD_Converter SHALL preserve both minimum and maximum cadence values
4. WHILE processing running workouts, THE KRD_Converter SHALL convert steps per minute to revolutions per minute by dividing by 2
5. WHEN THE KRD_Converter encounters open cadence targets, THE KRD_Converter SHALL represent them appropriately in the KRD format

### Requirement 6

**User Story:** As a workout designer, I want workout step order to be preserved exactly, so that the training progression follows the intended sequence.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes multiple workout steps, THE KRD_Converter SHALL maintain the original step order from the TCX file
2. WHEN THE KRD_Converter encounters nested workout steps, THE KRD_Converter SHALL preserve the hierarchical structure
3. WHEN THE Schema_Validator checks step ordering, THE Schema_Validator SHALL verify that step indices are sequential
4. WHEN THE KRD_Converter processes warmup and cooldown steps, THE KRD_Converter SHALL position them at the beginning and end respectively
5. WHEN THE KRD_Converter processes TCX workout files, THE KRD_Converter SHALL produce a KRD document with steps in the exact order they appear in the TCX file

### Requirement 7

**User Story:** As an interval training enthusiast, I want repetition blocks to be accurately converted, so that my repeated intervals are executed the correct number of times.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters a repetition block in TCX data, THE KRD_Converter SHALL preserve the repetition count as an integer
2. WHEN THE KRD_Converter processes steps within a repetition block, THE KRD_Converter SHALL group them under the repetition structure
3. WHEN THE KRD_Converter processes TCX Repeat elements, THE KRD_Converter SHALL correctly handle nested repetition structures
4. WHEN THE Tolerance_Checker validates repetition counts, THE Tolerance_Checker SHALL verify exact integer matching
5. WHEN THE TCX_Converter processes KRD repetition blocks, THE TCX_Converter SHALL encode them as TCX Repeat elements

### Requirement 8

**User Story:** As a fitness enthusiast, I want workout metadata to be fully captured, so that I can track workout origin, creation date, and sport type.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes TCX file metadata, THE KRD_Converter SHALL extract the creation timestamp in ISO 8601 format
2. WHEN THE KRD_Converter encounters sport type information, THE KRD_Converter SHALL map the TCX sport type to the KRD sport field
3. WHEN THE KRD_Converter encounters workout name, THE KRD_Converter SHALL populate the name field in KRD workout
4. WHERE creator information exists in TCX data, THE KRD_Converter SHALL include it in the KRD metadata
5. WHEN THE TCX_Converter processes KRD metadata, THE TCX_Converter SHALL generate valid TCX Author and Creator elements

### Requirement 9

**User Story:** As a quality assurance engineer, I want conversion errors to be clearly reported, so that I can quickly identify and fix data issues.

#### Acceptance Criteria

1. IF THE XML_Parser encounters malformed XML during parsing, THEN THE TCX_Parser SHALL report a descriptive error message indicating the XML error location
2. IF THE KRD_Converter encounters unsupported TCX elements, THEN THE KRD_Converter SHALL log a warning and continue processing
3. IF THE Schema_Validator detects validation failures, THEN THE Schema_Validator SHALL report all validation errors with field paths and expected values
4. IF THE Tolerance_Checker detects values outside acceptable tolerances, THEN THE Tolerance_Checker SHALL report the specific field and deviation amount
5. WHEN THE KRD_Converter encounters missing required fields, THE KRD_Converter SHALL report which fields are missing and halt conversion

### Requirement 10

**User Story:** As a fitness platform integrator, I want TCX-specific extensions to be preserved, so that no data is lost during conversion.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters TCX extension elements, THE KRD_Converter SHALL store them in the extensions.tcx object
2. WHEN THE KRD_Converter encounters power data in TCX extensions, THE KRD_Converter SHALL extract and convert it to KRD power targets
3. WHEN THE KRD_Converter processes custom TCX data fields, THE KRD_Converter SHALL maintain field names and values in extensions
4. WHEN THE Schema_Validator validates the KRD document, THE Schema_Validator SHALL allow arbitrary data in the extensions object
5. WHEN THE TCX_Converter writes extension data, THE TCX_Converter SHALL ensure the data is valid XML

### Requirement 11

**User Story:** As a fitness enthusiast, I want to convert KRD workout files back to TCX format, so that I can use edited workouts on fitness platforms that support TCX.

#### Acceptance Criteria

1. WHEN THE TCX_Converter receives a valid KRD workout file, THE TCX_Converter SHALL validate it against the workout.json schema before conversion
2. WHEN THE TCX_Writer encodes KRD workout data, THE TCX_Writer SHALL use the XML_Builder to produce a valid XML TCX file
3. WHEN THE TCX_Converter processes workout steps from KRD, THE TCX_Converter SHALL maintain the original step order in the TCX output
4. WHEN THE TCX_Converter processes repetition blocks from KRD, THE TCX_Converter SHALL encode them correctly in TCX Repeat format
5. WHEN THE TCX_Writer completes encoding, THE TCX_Writer SHALL produce a TCX file that validates against the TCX XSD schema

### Requirement 12

**User Story:** As a workout designer, I want duration specifications to be accurately converted from KRD to TCX, so that interval lengths are preserved.

#### Acceptance Criteria

1. WHEN THE TCX_Converter encounters time-based durations in KRD data, THE TCX_Converter SHALL convert seconds to the appropriate TCX time format
2. WHEN THE TCX_Converter encounters distance-based durations in KRD data, THE TCX_Converter SHALL convert meters to the appropriate TCX distance format
3. WHEN THE Tolerance_Checker validates KRD to TCX time conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 second
4. WHEN THE Tolerance_Checker validates KRD to TCX distance conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 meter
5. WHEN THE TCX_Converter encounters open durations in KRD, THE TCX_Converter SHALL encode them as lap button triggers in TCX format

### Requirement 13

**User Story:** As a fitness enthusiast, I want heart rate and speed targets to be accurately converted from KRD to TCX, so that my training zones are preserved.

#### Acceptance Criteria

1. WHEN THE TCX_Converter encounters heart rate targets in KRD data, THE TCX_Converter SHALL convert bpm values to the appropriate TCX heart rate format
2. WHEN THE TCX_Converter encounters speed targets in KRD data, THE TCX_Converter SHALL convert meters per second to the appropriate TCX speed format
3. WHEN THE Tolerance_Checker validates KRD to TCX heart rate conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 beat per minute
4. WHEN THE Tolerance_Checker validates KRD to TCX speed conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 0.01 meters per second
5. WHEN THE TCX_Converter encounters cadence targets in KRD data, THE TCX_Converter SHALL convert rpm values to the appropriate TCX cadence format

### Requirement 14

**User Story:** As a quality assurance engineer, I want round-trip conversion to be validated in both directions, so that I can verify data integrity across TCX → KRD → TCX and KRD → TCX → KRD transformations.

#### Acceptance Criteria

1. WHEN THE Round_Trip_Validator processes a TCX workout file, THE Round_Trip_Validator SHALL verify that TCX → KRD → TCX produces equivalent workout steps within tolerances
2. WHEN THE Round_Trip_Validator processes a TCX file with repetition blocks, THE Round_Trip_Validator SHALL verify that repetition blocks are preserved in TCX → KRD → TCX within tolerances
3. WHEN THE Round_Trip_Validator processes a TCX file with mixed target types, THE Round_Trip_Validator SHALL verify that all target values are preserved in TCX → KRD → TCX within defined tolerances
4. WHEN THE Round_Trip_Validator processes a KRD workout file, THE Round_Trip_Validator SHALL verify that KRD → TCX → KRD produces equivalent workout data within tolerances
5. WHEN THE Round_Trip_Validator detects deviations exceeding tolerances in either direction, THE Round_Trip_Validator SHALL report the specific fields and deviation amounts

### Requirement 15

**User Story:** As a workout designer, I want to combine different interval types and training targets within a single workout, so that I can create complex training sessions with varied objectives.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes a workout with mixed duration types, THE KRD_Converter SHALL correctly convert both time-based and distance-based intervals within the same workout
2. WHEN THE KRD_Converter processes a workout with mixed target types, THE KRD_Converter SHALL correctly convert heart rate, speed, and cadence targets within the same workout
3. WHEN THE TCX_Converter processes a KRD workout with mixed interval types, THE TCX_Converter SHALL correctly encode all duration types in the TCX output
4. WHEN THE TCX_Converter processes a KRD workout with mixed target types, THE TCX_Converter SHALL correctly encode all target types in the TCX output
5. WHEN THE Round_Trip_Validator processes a workout with any combination of interval durations and training targets, THE Round_Trip_Validator SHALL verify that all combinations are preserved within tolerances

### Requirement 16

**User Story:** As a developer, I want test fixture files available in the repository, so that I can implement and validate conversion tests consistently.

#### Acceptance Criteria

1. WHEN THE development environment is set up, THE repository SHALL contain sample TCX workout files in the test fixtures directory
2. WHEN THE development environment is set up, THE repository SHALL contain TCX files with heart rate targets in the test fixtures directory
3. WHEN THE development environment is set up, THE repository SHALL contain TCX files with speed targets in the test fixtures directory
4. WHEN THE development environment is set up, THE repository SHALL contain TCX files with repetition blocks in the test fixtures directory
5. WHEN THE test suite runs, THE test framework SHALL have access to all fixture files for golden file testing and round-trip validation
