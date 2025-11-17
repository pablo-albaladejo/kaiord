# Requirements Document

## Introduction

This feature enables bidirectional conversion between PowerAgent Workout XML (PWX) files and the Kaiord Representation Definition (KRD) format. PWX is an XML-based format developed by TrainingPeaks for storing structured workout data, widely used in the endurance training community. Users can convert PWX files to KRD for editing and validation, then convert back to PWX for use with TrainingPeaks and compatible platforms. PWX files contain structured workout data including workout steps, durations, targets (power, heart rate, speed), and repetitions. The conversion must preserve all workout structure and training targets in both directions, ensuring round-trip safety (PWX → KRD → PWX and KRD → PWX → KRD) within defined tolerances. This capability is essential for users who want to edit, validate, and re-export workout files consistently across different fitness platforms.

## Workout Types

The conversion must support the following primary workout types:

- **Power-based workouts** (cycling): Intervals defined by power targets (watts or %FTP)
- **Heart rate-based workouts**: Intervals defined by HR zones or specific bpm targets
- **Speed-based workouts** (running): Intervals defined by speed/pace targets
- **Cadence-based workouts**: Intervals defined by cadence targets (rpm)

Within each workout, intervals can have durations specified by:

- **Time-based duration**: Interval length in seconds
- **Distance-based duration**: Interval length in meters
- **Open duration**: Manual lap trigger

## Glossary

- **PWX_Parser**: The component responsible for reading and parsing XML PWX workout files
- **PWX_Writer**: The component responsible for encoding KRD workout data into XML PWX format
- **XML_Parser**: The XML parsing library used for reading PWX files (e.g., fast-xml-parser)
- **XML_Builder**: The XML building library used for writing PWX files (e.g., fast-xml-parser)
- **KRD_Converter**: The component that transforms parsed PWX workout data into KRD format
- **PWX_Converter**: The component that transforms KRD workout data into PWX format
- **Workout_Step**: A single training interval within a workout, containing duration and target specifications
- **Duration_Spec**: The specification for how long a workout step lasts (time-based in seconds, distance-based in meters, or open)
- **Target_Spec**: The training target for a workout step (power in watts/%FTP, heart rate in bpm/zones, speed in m/s, or cadence in rpm)
- **Power_Target**: A target specified in absolute watts or as percentage of FTP
- **HR_Target**: A target specified in beats per minute or as a heart rate zone
- **Speed_Target**: A target specified as speed in meters per second
- **Cadence_Target**: A target specified in revolutions per minute
- **Repetition_Block**: A group of workout steps that repeat a specified number of times
- **Schema_Validator**: The component that validates KRD output against the JSON schema
- **Tolerance_Checker**: The component that verifies conversion accuracy within acceptable tolerances
- **Round_Trip_Validator**: The component that validates PWX → KRD → PWX conversions preserve data within tolerances

## Requirements

### Requirement 1

**User Story:** As a TrainingPeaks user, I want to convert PWX workout files to KRD format, so that I can edit workout structures in a human-readable format and validate them against a standard schema.

#### Acceptance Criteria

1. WHEN THE PWX_Parser receives a valid PWX workout file, THE PWX_Parser SHALL use the XML_Parser to decode the XML data into structured workout objects
2. WHEN THE KRD_Converter processes decoded PWX workout data, THE KRD_Converter SHALL produce a KRD document with version set to "1.0"
3. WHEN THE Schema_Validator validates KRD output, THE Schema_Validator SHALL use the Zod schema as the source of truth
4. IF THE Schema_Validator detects validation errors, THEN THE KRD_Converter SHALL report the specific validation failures with actionable error messages
5. WHEN THE KRD_Converter writes the output file, THE KRD_Converter SHALL use the .krd file extension

### Requirement 2

**User Story:** As a TrainingPeaks user, I want workout step durations to be accurately converted, so that my training intervals maintain their intended length.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters a time-based duration in PWX data, THE KRD_Converter SHALL convert the duration to seconds as a numeric value
2. WHEN THE KRD_Converter encounters a distance-based duration in PWX data, THE KRD_Converter SHALL convert the duration to meters as a numeric value
3. WHEN THE Tolerance_Checker validates time-based durations, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 second
4. WHEN THE Tolerance_Checker validates distance-based durations, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 meter
5. WHEN THE KRD_Converter processes open durations in PWX, THE KRD_Converter SHALL represent them with type "open"

### Requirement 3

**User Story:** As a cyclist, I want power targets to be precisely converted, so that I receive accurate training intensity prescriptions.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters absolute power targets in PWX data, THE KRD_Converter SHALL convert the power value to watts as a numeric value
2. WHEN THE KRD_Converter encounters FTP-based power targets in PWX data, THE KRD_Converter SHALL preserve the percentage relationship to FTP
3. WHEN THE KRD_Converter encounters power zones in PWX data, THE KRD_Converter SHALL map them to KRD power zones (1-7)
4. WHEN THE Tolerance_Checker validates absolute power targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 watt
5. WHEN THE Tolerance_Checker validates FTP-based power targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 percent of FTP

### Requirement 4

**User Story:** As a TrainingPeaks user, I want heart rate targets to be accurately converted, so that I train in the correct cardiovascular zones.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters absolute heart rate targets in PWX data, THE KRD_Converter SHALL convert the heart rate value to beats per minute as an integer
2. WHEN THE KRD_Converter encounters heart rate zone targets in PWX data, THE KRD_Converter SHALL preserve the zone identifier (1-5)
3. WHEN THE Tolerance_Checker validates heart rate targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 beat per minute
4. WHEN THE KRD_Converter encounters heart rate range targets, THE KRD_Converter SHALL preserve both minimum and maximum heart rate values
5. WHEN THE KRD_Converter encounters percentage-based heart rate targets, THE KRD_Converter SHALL preserve the percentage relationship to maximum heart rate

### Requirement 5

**User Story:** As a runner or cyclist, I want speed targets to be accurately converted, so that I maintain the correct pace during workouts.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters speed targets in PWX data, THE KRD_Converter SHALL convert the speed value to meters per second as a numeric value
2. WHEN THE Tolerance_Checker validates speed targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 0.01 meters per second
3. WHEN THE KRD_Converter encounters speed range targets, THE KRD_Converter SHALL preserve both minimum and maximum speed values
4. WHEN THE KRD_Converter encounters pace zones in PWX data, THE KRD_Converter SHALL convert them to speed values in meters per second
5. WHEN THE PWX_Converter processes KRD pace targets, THE PWX_Converter SHALL convert meters per second to PWX speed format

### Requirement 6

**User Story:** As a cyclist or runner, I want cadence targets to be accurately converted, so that I maintain proper pedaling or running efficiency.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters cadence targets in PWX data, THE KRD_Converter SHALL convert the cadence value to revolutions per minute as a numeric value
2. WHEN THE Tolerance_Checker validates cadence targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 revolution per minute
3. WHEN THE KRD_Converter encounters cadence range targets, THE KRD_Converter SHALL preserve both minimum and maximum cadence values
4. WHILE processing running workouts, THE KRD_Converter SHALL convert steps per minute to revolutions per minute by dividing by 2
5. WHEN THE KRD_Converter encounters open cadence targets, THE KRD_Converter SHALL represent them appropriately in the KRD format

### Requirement 7

**User Story:** As a workout designer, I want workout step order to be preserved exactly, so that the training progression follows the intended sequence.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes multiple workout steps, THE KRD_Converter SHALL maintain the original step order from the PWX file
2. WHEN THE KRD_Converter encounters nested workout steps, THE KRD_Converter SHALL preserve the hierarchical structure
3. WHEN THE Schema_Validator checks step ordering, THE Schema_Validator SHALL verify that step indices are sequential
4. WHEN THE KRD_Converter processes warmup and cooldown steps, THE KRD_Converter SHALL position them at the beginning and end respectively
5. WHEN THE KRD_Converter processes PWX workout files, THE KRD_Converter SHALL produce a KRD document with steps in the exact order they appear in the PWX file

### Requirement 8

**User Story:** As an interval training enthusiast, I want repetition blocks to be accurately converted, so that my repeated intervals are executed the correct number of times.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters a repetition block in PWX data, THE KRD_Converter SHALL preserve the repetition count as an integer
2. WHEN THE KRD_Converter processes steps within a repetition block, THE KRD_Converter SHALL group them under the repetition structure
3. WHEN THE KRD_Converter processes PWX repeat elements, THE KRD_Converter SHALL correctly handle nested repetition structures
4. WHEN THE Tolerance_Checker validates repetition counts, THE Tolerance_Checker SHALL verify exact integer matching
5. WHEN THE PWX_Converter processes KRD repetition blocks, THE PWX_Converter SHALL encode them as PWX repeat elements

### Requirement 9

**User Story:** As a TrainingPeaks user, I want workout metadata to be fully captured, so that I can track workout origin, creation date, and sport type.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes PWX file metadata, THE KRD_Converter SHALL extract the creation timestamp in ISO 8601 format
2. WHEN THE KRD_Converter encounters sport type information, THE KRD_Converter SHALL map the PWX sport type to the KRD sport field
3. WHEN THE KRD_Converter encounters workout name, THE KRD_Converter SHALL populate the name field in KRD workout
4. WHERE author information exists in PWX data, THE KRD_Converter SHALL include it in the KRD metadata
5. WHEN THE PWX_Converter processes KRD metadata, THE PWX_Converter SHALL generate valid PWX author and athlete elements

### Requirement 10

**User Story:** As a quality assurance engineer, I want conversion errors to be clearly reported, so that I can quickly identify and fix data issues.

#### Acceptance Criteria

1. IF THE XML_Parser encounters malformed XML during parsing, THEN THE PWX_Parser SHALL report a descriptive error message indicating the XML error location
2. IF THE KRD_Converter encounters unsupported PWX elements, THEN THE KRD_Converter SHALL log a warning and continue processing
3. IF THE Schema_Validator detects validation failures, THEN THE Schema_Validator SHALL report all validation errors with field paths and expected values
4. IF THE Tolerance_Checker detects values outside acceptable tolerances, THEN THE Tolerance_Checker SHALL report the specific field and deviation amount
5. WHEN THE KRD_Converter encounters missing required fields, THE KRD_Converter SHALL report which fields are missing and halt conversion

### Requirement 11

**User Story:** As a fitness platform integrator, I want PWX-specific extensions to be preserved, so that no data is lost during conversion.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters PWX extension elements, THE KRD_Converter SHALL store them in the extensions.pwx object
2. WHEN THE KRD_Converter encounters custom PWX data fields, THE KRD_Converter SHALL maintain field names and values in extensions
3. WHEN THE KRD_Converter processes TrainingPeaks-specific fields, THE KRD_Converter SHALL preserve them in extensions
4. WHEN THE Schema_Validator validates the KRD document, THE Schema_Validator SHALL allow arbitrary data in the extensions object
5. WHEN THE PWX_Converter writes extension data, THE PWX_Converter SHALL ensure the data is valid XML

### Requirement 12

**User Story:** As a TrainingPeaks user, I want to convert KRD workout files back to PWX format, so that I can use edited workouts on TrainingPeaks.

#### Acceptance Criteria

1. WHEN THE PWX_Converter receives a valid KRD workout file, THE PWX_Converter SHALL validate it against the workout.json schema before conversion
2. WHEN THE PWX_Writer encodes KRD workout data, THE PWX_Writer SHALL use the XML_Builder to produce a valid XML PWX file
3. WHEN THE PWX_Converter processes workout steps from KRD, THE PWX_Converter SHALL maintain the original step order in the PWX output
4. WHEN THE PWX_Converter processes repetition blocks from KRD, THE PWX_Converter SHALL encode them correctly in PWX repeat format
5. WHEN THE PWX_Writer completes encoding, THE PWX_Writer SHALL produce a PWX file that validates against the PWX XSD schema

### Requirement 13

**User Story:** As a workout designer, I want duration specifications to be accurately converted from KRD to PWX, so that interval lengths are preserved.

#### Acceptance Criteria

1. WHEN THE PWX_Converter encounters time-based durations in KRD data, THE PWX_Converter SHALL convert seconds to the appropriate PWX time format
2. WHEN THE PWX_Converter encounters distance-based durations in KRD data, THE PWX_Converter SHALL convert meters to the appropriate PWX distance format
3. WHEN THE Tolerance_Checker validates KRD to PWX time conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 second
4. WHEN THE Tolerance_Checker validates KRD to PWX distance conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 meter
5. WHEN THE PWX_Converter encounters open durations in KRD, THE PWX_Converter SHALL encode them appropriately in PWX format

### Requirement 14

**User Story:** As a cyclist, I want power targets to be accurately converted from KRD to PWX, so that my training intensity is preserved.

#### Acceptance Criteria

1. WHEN THE PWX_Converter encounters absolute power targets in KRD data, THE PWX_Converter SHALL convert watts to the appropriate PWX power format
2. WHEN THE PWX_Converter encounters FTP-based power targets in KRD data, THE PWX_Converter SHALL preserve the percentage relationship in PWX format
3. WHEN THE PWX_Converter encounters power zone targets in KRD data, THE PWX_Converter SHALL encode the zone identifier in PWX format
4. WHEN THE Tolerance_Checker validates KRD to PWX power conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 watt
5. WHEN THE Tolerance_Checker validates KRD to PWX FTP-based conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 percent of FTP

### Requirement 15

**User Story:** As a TrainingPeaks user, I want heart rate, speed, and cadence targets to be accurately converted from KRD to PWX, so that my training zones are preserved.

#### Acceptance Criteria

1. WHEN THE PWX_Converter encounters heart rate targets in KRD data, THE PWX_Converter SHALL convert bpm values to the appropriate PWX heart rate format
2. WHEN THE PWX_Converter encounters speed targets in KRD data, THE PWX_Converter SHALL convert meters per second to the appropriate PWX speed format
3. WHEN THE Tolerance_Checker validates KRD to PWX heart rate conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 beat per minute
4. WHEN THE Tolerance_Checker validates KRD to PWX speed conversions, THE Tolerance_Checker SHALL verify accuracy within plus or minus 0.01 meters per second
5. WHEN THE PWX_Converter encounters cadence targets in KRD data, THE PWX_Converter SHALL convert rpm values to the appropriate PWX cadence format

### Requirement 16

**User Story:** As a quality assurance engineer, I want round-trip conversion to be validated in both directions, so that I can verify data integrity across PWX → KRD → PWX and KRD → PWX → KRD transformations.

#### Acceptance Criteria

1. WHEN THE Round_Trip_Validator processes a PWX workout file, THE Round_Trip_Validator SHALL verify that PWX → KRD → PWX produces equivalent workout steps within tolerances
2. WHEN THE Round_Trip_Validator processes a PWX file with repetition blocks, THE Round_Trip_Validator SHALL verify that repetition blocks are preserved in PWX → KRD → PWX within tolerances
3. WHEN THE Round_Trip_Validator processes a PWX file with mixed target types, THE Round_Trip_Validator SHALL verify that all target values are preserved in PWX → KRD → PWX within defined tolerances
4. WHEN THE Round_Trip_Validator processes a KRD workout file, THE Round_Trip_Validator SHALL verify that KRD → PWX → KRD produces equivalent workout data within tolerances
5. WHEN THE Round_Trip_Validator detects deviations exceeding tolerances in either direction, THE Round_Trip_Validator SHALL report the specific fields and deviation amounts

### Requirement 17

**User Story:** As a workout designer, I want to combine different interval types and training targets within a single workout, so that I can create complex training sessions with varied objectives.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes a workout with mixed duration types, THE KRD_Converter SHALL correctly convert both time-based and distance-based intervals within the same workout
2. WHEN THE KRD_Converter processes a workout with mixed target types, THE KRD_Converter SHALL correctly convert power, heart rate, speed, and cadence targets within the same workout
3. WHEN THE PWX_Converter processes a KRD workout with mixed interval types, THE PWX_Converter SHALL correctly encode all duration types in the PWX output
4. WHEN THE PWX_Converter processes a KRD workout with mixed target types, THE PWX_Converter SHALL correctly encode all target types in the PWX output
5. WHEN THE Round_Trip_Validator processes a workout with any combination of interval durations and training targets, THE Round_Trip_Validator SHALL verify that all combinations are preserved within tolerances

### Requirement 18

**User Story:** As a developer, I want test fixture files available in the repository, so that I can implement and validate conversion tests consistently.

#### Acceptance Criteria

1. WHEN THE development environment is set up, THE repository SHALL contain sample PWX workout files in the test fixtures directory
2. WHEN THE development environment is set up, THE repository SHALL contain PWX files with power targets in the test fixtures directory
3. WHEN THE development environment is set up, THE repository SHALL contain PWX files with heart rate targets in the test fixtures directory
4. WHEN THE development environment is set up, THE repository SHALL contain PWX files with repetition blocks in the test fixtures directory
5. WHEN THE test suite runs, THE test framework SHALL have access to all fixture files for golden file testing and round-trip validation
