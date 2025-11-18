# Requirements Document

## Introduction

This feature enables bidirectional conversion between Zwift workout files (.zwo format) and the Kaiord Representation Definition (KRD) format. Zwift workout files are XML-based structured workout definitions used by the Zwift virtual cycling and running platform. These files define interval-based training sessions with power, pace, and cadence targets.

**Zwift Workout Format**: XML-based format with elements for steady-state intervals, ramps, warmups, cooldowns, free rides, and repeated intervals (IntervalsT).

Users can convert Zwift .zwo files to KRD for editing and validation, then convert back to .zwo format for use on the Zwift platform. Zwift files contain structured workout data including workout steps, durations (time or distance), targets (power/FTP percentage, pace, cadence), text events (coaching cues), and repetitions. The conversion must preserve all workout structure and training targets in both directions, ensuring round-trip safety (Zwift → KRD → Zwift and KRD → Zwift → KRD) within defined tolerances. This capability is essential for users who want to edit, validate, and re-export Zwift workout files consistently.

## Workout Types

The conversion must support the following Zwift workout interval types:

- **SteadyState**: Constant power/pace intervals with fixed duration
- **Warmup**: Gradual ramp from low to high power/pace
- **Ramp**: Linear progression between two power/pace values
- **Cooldown**: Gradual ramp from high to low power/pace
- **IntervalsT**: Repeated on/off intervals (e.g., 8x 30s on / 30s off)
- **FreeRide**: Open-ended intervals with optional flat road simulation

Within each workout, intervals can have durations specified by:

- **Time-based duration**: Interval length in seconds
- **Distance-based duration**: Interval length in meters (for running workouts)

Targets can be specified as:

- **Power targets**: Percentage of FTP (0.0 to 2.0+) for cycling workouts
- **Pace targets**: Seconds per kilometer for running workouts
- **Cadence targets**: RPM for cycling or SPM for running

## Glossary

- **Zwift_Parser**: The component responsible for reading and parsing XML Zwift workout files
- **Zwift_Writer**: The component responsible for encoding KRD workout data into XML Zwift format
- **XML_Parser**: The XML parsing library used for reading Zwift files (e.g., fast-xml-parser)
- **XML_Builder**: The XML building library used for writing Zwift files (e.g., fast-xml-parser)
- **KRD_Converter**: The component that transforms parsed Zwift workout data into KRD format
- **Zwift_Converter**: The component that transforms KRD workout data into Zwift format
- **Workout_Step**: A single training interval within a workout, containing duration and target specifications
- **Duration_Spec**: The specification for how long a workout step lasts (time-based in seconds or distance-based in meters)
- **Target_Spec**: The training target for a workout step (power as FTP percentage, pace in sec/km, or cadence in rpm/spm)
- **Power_Target**: A target specified as a percentage of Functional Threshold Power (FTP), ranging from 0.0 to 2.0+
- **Pace_Target**: A target specified as seconds per kilometer for running workouts
- **Cadence_Target**: A target specified in revolutions per minute (cycling) or steps per minute (running)
- **Text_Event**: A coaching cue or message displayed at a specific time or distance offset during an interval
- **Repetition_Block**: A group of on/off intervals that repeat a specified number of times (IntervalsT element)
- **Schema_Validator**: The component that validates KRD output against the JSON schema
- **Tolerance_Checker**: The component that verifies conversion accuracy within acceptable tolerances
- **Round_Trip_Validator**: The component that validates Zwift → KRD → Zwift conversions preserve data within tolerances
- **XSD_Validator**: The component that validates Zwift XML files against the Zwift workout XSD schema
- **FTP**: Functional Threshold Power, the maximum power a cyclist can sustain for one hour

## Requirements

### Requirement 1

**User Story:** As a Zwift user, I want to convert Zwift workout files to KRD format, so that I can edit workout structures in a human-readable format and validate them against a standard schema.

#### Acceptance Criteria

1. WHEN THE Zwift_Parser receives a valid Zwift workout file, THE Zwift_Parser SHALL use the XML_Parser to decode the XML data into structured workout objects
2. WHEN THE KRD_Converter processes decoded Zwift workout data, THE KRD_Converter SHALL produce a KRD document with version set to "1.0"
3. WHEN THE Schema_Validator validates KRD output, THE Schema_Validator SHALL use the Zod schema as the source of truth
4. IF THE Schema_Validator detects validation errors, THEN THE KRD_Converter SHALL report the specific validation failures with actionable error messages
5. WHEN THE KRD_Converter writes the output file, THE KRD_Converter SHALL use the .krd file extension

### Requirement 2

**User Story:** As a Zwift user, I want workout metadata to be fully captured, so that I can track workout name, author, description, and sport type.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes Zwift file metadata, THE KRD_Converter SHALL extract the workout name and populate the name field in KRD workout
2. WHEN THE KRD_Converter encounters author information, THE KRD_Converter SHALL include it in the KRD metadata
3. WHEN THE KRD_Converter encounters description text, THE KRD_Converter SHALL store it in the KRD workout notes or extensions
4. WHEN THE KRD_Converter encounters sportType element, THE KRD_Converter SHALL map "bike" to "cycling" and "run" to "running" in the KRD sport field
5. WHEN THE Zwift_Converter processes KRD metadata, THE Zwift_Converter SHALL generate valid Zwift author, name, description, and sportType elements

### Requirement 3

**User Story:** As a Zwift user, I want workout step durations to be accurately converted, so that my training intervals maintain their intended length.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters a time-based Duration attribute in Zwift data, THE KRD_Converter SHALL convert the duration to seconds as a numeric value
2. WHEN THE KRD_Converter encounters a distance-based duration in Zwift running workouts, THE KRD_Converter SHALL convert the duration to meters as a numeric value
3. WHEN THE Tolerance_Checker validates time-based durations, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 second
4. WHEN THE Tolerance_Checker validates distance-based durations, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 meter
5. WHEN THE Zwift_Converter processes KRD durations, THE Zwift_Converter SHALL encode them in the appropriate Zwift Duration attribute format

### Requirement 4

**User Story:** As a cyclist, I want power targets to be accurately converted, so that I train at the correct intensity relative to my FTP.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters Power attributes in Zwift data, THE KRD_Converter SHALL convert the FTP percentage to a KRD power target with unit "percent_ftp"
2. WHEN THE KRD_Converter encounters PowerLow and PowerHigh attributes in ramp intervals, THE KRD_Converter SHALL create a KRD range target with min and max values
3. WHEN THE Tolerance_Checker validates power targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 percent FTP
4. WHEN THE Zwift_Converter processes KRD power targets with unit "percent_ftp", THE Zwift_Converter SHALL encode them as Zwift Power attributes
5. WHEN THE Zwift_Converter processes KRD power range targets, THE Zwift_Converter SHALL encode them as Zwift PowerLow and PowerHigh attributes

### Requirement 5

**User Story:** As a runner, I want pace targets to be accurately converted, so that I maintain the correct running speed during workouts.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters pace attributes in Zwift running workouts, THE KRD_Converter SHALL convert seconds per kilometer to meters per second for KRD pace targets
2. WHEN THE Tolerance_Checker validates pace targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 0.01 meters per second
3. WHEN THE Zwift_Converter processes KRD pace targets, THE Zwift_Converter SHALL convert meters per second to seconds per kilometer for Zwift pace attributes
4. WHEN THE KRD_Converter encounters thresholdSecPerKm in Zwift metadata, THE KRD_Converter SHALL store it in KRD extensions for round-trip preservation
5. WHEN THE Zwift_Converter processes KRD running workouts, THE Zwift_Converter SHALL include thresholdSecPerKm in the Zwift output if available

### Requirement 6

**User Story:** As a cyclist or runner, I want cadence targets to be accurately converted, so that I maintain proper pedaling or running efficiency.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters Cadence attributes in Zwift data, THE KRD_Converter SHALL convert the cadence value to revolutions per minute as a numeric value
2. WHEN THE Tolerance_Checker validates cadence targets, THE Tolerance_Checker SHALL verify accuracy within plus or minus 1 revolution per minute
3. WHEN THE KRD_Converter encounters CadenceResting attributes in IntervalsT elements, THE KRD_Converter SHALL preserve the resting cadence value for off intervals
4. WHILE processing running workouts, THE KRD_Converter SHALL convert steps per minute to revolutions per minute by dividing by 2
5. WHEN THE Zwift_Converter processes KRD cadence targets, THE Zwift_Converter SHALL encode them as Zwift Cadence attributes

### Requirement 7

**User Story:** As a Zwift user, I want SteadyState intervals to be accurately converted, so that constant-power intervals are preserved.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters a SteadyState element in Zwift data, THE KRD_Converter SHALL create a KRD workout step with durationType "time" or "distance"
2. WHEN THE KRD_Converter processes SteadyState Power attribute, THE KRD_Converter SHALL create a KRD power target with the FTP percentage value
3. WHEN THE KRD_Converter processes SteadyState Duration attribute, THE KRD_Converter SHALL convert it to seconds for time-based or meters for distance-based durations
4. WHEN THE Zwift_Converter processes KRD steps with constant power targets, THE Zwift_Converter SHALL encode them as Zwift SteadyState elements
5. WHEN THE Round_Trip_Validator processes SteadyState intervals, THE Round_Trip_Validator SHALL verify that power and duration values are preserved within tolerances

### Requirement 8

**User Story:** As a Zwift user, I want Warmup, Ramp, and Cooldown intervals to be accurately converted, so that progressive intensity changes are preserved.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters Warmup, Ramp, or Cooldown elements in Zwift data, THE KRD_Converter SHALL create KRD workout steps with range targets
2. WHEN THE KRD_Converter processes PowerLow and PowerHigh attributes, THE KRD_Converter SHALL create a KRD power target with unit "range" and min/max values
3. WHEN THE Zwift_Converter processes KRD steps with power range targets, THE Zwift_Converter SHALL determine whether to encode as Warmup, Ramp, or Cooldown based on step position and intensity pattern
4. WHEN THE Tolerance_Checker validates ramp intervals, THE Tolerance_Checker SHALL verify that both min and max power values are preserved within plus or minus 1 percent FTP
5. WHEN THE Round_Trip_Validator processes ramp intervals, THE Round_Trip_Validator SHALL verify that PowerLow and PowerHigh values are preserved within tolerances

### Requirement 9

**User Story:** As an interval training enthusiast, I want IntervalsT (repeated intervals) to be accurately converted, so that my on/off intervals are executed the correct number of times.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters an IntervalsT element in Zwift data, THE KRD_Converter SHALL create a KRD repetition block with the Repeat count
2. WHEN THE KRD_Converter processes OnDuration and OnPower attributes, THE KRD_Converter SHALL create a KRD workout step for the "on" interval
3. WHEN THE KRD_Converter processes OffDuration and OffPower attributes, THE KRD_Converter SHALL create a KRD workout step for the "off" interval
4. WHEN THE Zwift_Converter processes KRD repetition blocks with two steps, THE Zwift_Converter SHALL encode them as Zwift IntervalsT elements
5. WHEN THE Tolerance_Checker validates repetition counts, THE Tolerance_Checker SHALL verify exact integer matching

### Requirement 10

**User Story:** As a Zwift user, I want FreeRide intervals to be accurately converted, so that open-ended recovery or exploration segments are preserved.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters a FreeRide element in Zwift data, THE KRD_Converter SHALL create a KRD workout step with targetType "open"
2. WHEN THE KRD_Converter processes FreeRide Duration attribute, THE KRD_Converter SHALL convert it to seconds for the KRD duration
3. WHEN THE KRD_Converter encounters FlatRoad attribute in FreeRide elements, THE KRD_Converter SHALL store it in KRD extensions for round-trip preservation
4. WHEN THE Zwift_Converter processes KRD steps with targetType "open", THE Zwift_Converter SHALL encode them as Zwift FreeRide elements
5. WHEN THE Round_Trip_Validator processes FreeRide intervals, THE Round_Trip_Validator SHALL verify that duration values are preserved within tolerances

### Requirement 11

**User Story:** As a Zwift user, I want text events (coaching cues) to be accurately converted, so that workout instructions are preserved.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters textevent elements within Zwift intervals, THE KRD_Converter SHALL extract the message attribute and store it in KRD step notes
2. WHEN THE KRD_Converter processes timeoffset or distoffset attributes, THE KRD_Converter SHALL store them in KRD extensions for round-trip preservation
3. WHEN THE Zwift_Converter processes KRD step notes, THE Zwift_Converter SHALL encode them as Zwift textevent elements
4. WHEN THE Zwift_Converter processes multiple text events for a single step, THE Zwift_Converter SHALL create multiple textevent elements with appropriate offsets
5. WHEN THE Round_Trip_Validator processes text events, THE Round_Trip_Validator SHALL verify that message content is preserved exactly

### Requirement 12

**User Story:** As a workout designer, I want workout step order to be preserved exactly, so that the training progression follows the intended sequence.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes multiple workout intervals, THE KRD_Converter SHALL maintain the original interval order from the Zwift file
2. WHEN THE Schema_Validator checks step ordering, THE Schema_Validator SHALL verify that step indices are sequential
3. WHEN THE Zwift_Converter processes KRD workout steps, THE Zwift_Converter SHALL maintain the step order in the Zwift output
4. WHEN THE KRD_Converter processes Warmup intervals at the beginning, THE KRD_Converter SHALL set intensity to "warmup"
5. WHEN THE KRD_Converter processes Cooldown intervals at the end, THE KRD_Converter SHALL set intensity to "cooldown"

### Requirement 13

**User Story:** As a quality assurance engineer, I want conversion errors to be clearly reported, so that I can quickly identify and fix data issues.

#### Acceptance Criteria

1. IF THE XML_Parser encounters malformed XML during parsing, THEN THE Zwift_Parser SHALL report a descriptive error message indicating the XML error location
2. IF THE KRD_Converter encounters unsupported Zwift elements, THEN THE KRD_Converter SHALL log a warning and continue processing
3. IF THE Schema_Validator detects validation failures, THEN THE Schema_Validator SHALL report all validation errors with field paths and expected values
4. IF THE Tolerance_Checker detects values outside acceptable tolerances, THEN THE Tolerance_Checker SHALL report the specific field and deviation amount
5. WHEN THE KRD_Converter encounters missing required fields, THE KRD_Converter SHALL report which fields are missing and halt conversion

### Requirement 14

**User Story:** As a Zwift user, I want Zwift-specific extensions to be preserved, so that no data is lost during conversion.

#### Acceptance Criteria

1. WHEN THE KRD_Converter encounters Zwift tag elements, THE KRD_Converter SHALL store them in the extensions.zwift object
2. WHEN THE KRD_Converter encounters durationType metadata, THE KRD_Converter SHALL store it in KRD extensions for round-trip preservation
3. WHEN THE KRD_Converter processes custom Zwift attributes, THE KRD_Converter SHALL maintain attribute names and values in extensions
4. WHEN THE Schema_Validator validates the KRD document, THE Schema_Validator SHALL allow arbitrary data in the extensions object
5. WHEN THE Zwift_Converter writes extension data, THE Zwift_Converter SHALL ensure the data is valid XML

### Requirement 15

**User Story:** As a Zwift user, I want to convert KRD workout files back to Zwift format, so that I can use edited workouts on the Zwift platform.

#### Acceptance Criteria

1. WHEN THE Zwift_Converter receives a valid KRD workout file, THE Zwift_Converter SHALL validate it against the workout.json schema before conversion
2. WHEN THE Zwift_Writer encodes KRD workout data, THE Zwift_Writer SHALL use the XML_Builder to produce a valid XML Zwift file
3. WHEN THE Zwift_Converter processes workout steps from KRD, THE Zwift_Converter SHALL maintain the original step order in the Zwift output
4. WHEN THE Zwift_Converter processes repetition blocks from KRD, THE Zwift_Converter SHALL encode them correctly in Zwift IntervalsT format
5. WHEN THE Zwift_Writer completes encoding, THE Zwift_Writer SHALL produce a Zwift file that validates against the Zwift XSD schema

### Requirement 16

**User Story:** As a quality assurance engineer, I want round-trip conversion to be validated in both directions, so that I can verify data integrity across Zwift → KRD → Zwift and KRD → Zwift → KRD transformations.

#### Acceptance Criteria

1. WHEN THE Round_Trip_Validator processes a Zwift workout file, THE Round_Trip_Validator SHALL verify that Zwift → KRD → Zwift produces equivalent workout steps within tolerances
2. WHEN THE Round_Trip_Validator processes a Zwift file with IntervalsT blocks, THE Round_Trip_Validator SHALL verify that repetition blocks are preserved in Zwift → KRD → Zwift within tolerances
3. WHEN THE Round_Trip_Validator processes a Zwift file with mixed interval types, THE Round_Trip_Validator SHALL verify that all interval types are preserved in Zwift → KRD → Zwift within defined tolerances
4. WHEN THE Round_Trip_Validator processes a KRD workout file, THE Round_Trip_Validator SHALL verify that KRD → Zwift → KRD produces equivalent workout data within tolerances
5. WHEN THE Round_Trip_Validator detects deviations exceeding tolerances in either direction, THE Round_Trip_Validator SHALL report the specific fields and deviation amounts

### Requirement 17

**User Story:** As a developer, I want test fixture files available in the repository, so that I can implement and validate conversion tests consistently.

#### Acceptance Criteria

1. WHEN THE development environment is set up, THE repository SHALL contain sample Zwift workout files in the test fixtures directory
2. WHEN THE development environment is set up, THE repository SHALL contain Zwift files with SteadyState intervals in the test fixtures directory
3. WHEN THE development environment is set up, THE repository SHALL contain Zwift files with IntervalsT blocks in the test fixtures directory
4. WHEN THE development environment is set up, THE repository SHALL contain Zwift files with ramp intervals (Warmup, Ramp, Cooldown) in the test fixtures directory
5. WHEN THE test suite runs, THE test framework SHALL have access to all fixture files for golden file testing and round-trip validation

### Requirement 18

**User Story:** As a quality assurance engineer, I want Zwift files to be validated against the official XSD schema, so that I can ensure generated Zwift files are compliant with the Zwift standard and detect invalid input files before processing.

#### Acceptance Criteria

1. WHEN THE XSD_Validator receives a Zwift XML string, THE XSD_Validator SHALL validate it against the Zwift workout XSD schema
2. IF THE XSD_Validator detects schema violations, THEN THE XSD_Validator SHALL report all validation errors with element paths and violation descriptions
3. WHEN THE Zwift_Parser receives an input Zwift file, THE Zwift_Parser SHALL validate the XML against the XSD schema before attempting conversion
4. WHEN THE Zwift_Writer generates a Zwift file from KRD, THE Zwift_Writer SHALL validate the generated XML against the XSD schema before returning the result
5. IF THE XSD_Validator detects that a Zwift file does not conform to the XSD schema, THEN THE System SHALL throw a ZwiftValidationError with actionable error messages

### Requirement 19

**User Story:** As a workout designer, I want to combine different interval types within a single workout, so that I can create complex training sessions with varied objectives.

#### Acceptance Criteria

1. WHEN THE KRD_Converter processes a workout with mixed interval types, THE KRD_Converter SHALL correctly convert SteadyState, Warmup, Ramp, Cooldown, IntervalsT, and FreeRide intervals within the same workout
2. WHEN THE Zwift_Converter processes a KRD workout with mixed interval types, THE Zwift_Converter SHALL correctly encode all interval types in the Zwift output
3. WHEN THE Round_Trip_Validator processes a workout with any combination of interval types, THE Round_Trip_Validator SHALL verify that all combinations are preserved within tolerances
4. WHEN THE KRD_Converter processes a workout with both cycling and running elements, THE KRD_Converter SHALL correctly handle sport-specific attributes
5. WHEN THE Zwift_Converter processes a KRD workout, THE Zwift_Converter SHALL ensure that the sportType is consistent throughout the Zwift output
