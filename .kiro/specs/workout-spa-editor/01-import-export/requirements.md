# Requirements Document - Import/Export FIT, TCX, and PWX Formats

## Introduction

This feature enables the Workout SPA Editor to import and export workout files in industry-standard formats (FIT, TCX, PWX) in addition to the native KRD format. This is critical for device compatibility and interoperability with training platforms like Garmin Connect, TrainingPeaks, and Zwift.

## Glossary

- **FIT**: Flexible and Interoperable Data Transfer - Garmin's binary format for fitness data
- **TCX**: Training Center XML - Garmin's XML format for workout and activity data
- **PWX**: PowerAgent XML - TrainingPeaks' XML format for workout data
- **KRD**: Kaiord Representation Definition - JSON-based canonical format
- **Round-trip Conversion**: Converting from one format to another and back without data loss
- **@kaiord/core**: Core library providing format conversion functions (toKRD, fromKRD)

## Requirements

### Requirement 12 (Import/Export Multiple Formats)

**User Story:** As an athlete, I want to import and export my workout to FIT, TCX, and PWX formats, so that I can load it directly into my training device and edit existing workout files

#### Acceptance Criteria

1. WHEN THE user initiates file loading, THE Workout SPA Editor SHALL provide a file input accepting .krd, .json, .fit, .tcx, and .pwx files
2. WHEN THE user selects a FIT file, THE Workout SPA Editor SHALL convert the FIT binary to KRD format using the @kaiord/core library
3. WHEN THE user selects a TCX file, THE Workout SPA Editor SHALL convert the TCX XML to KRD format using the @kaiord/core library
4. WHEN THE user selects a PWX file, THE Workout SPA Editor SHALL convert the PWX XML to KRD format using the @kaiord/core library
5. WHEN THE import conversion fails, THE Workout SPA Editor SHALL display an error message with specific conversion issues
6. WHEN THE user initiates export, THE Workout SPA Editor SHALL provide format selection options (FIT, TCX, PWX, KRD)
7. WHEN THE user selects FIT format for export, THE Workout SPA Editor SHALL convert the KRD workout to FIT binary format using the @kaiord/core library
8. WHEN THE user selects TCX format for export, THE Workout SPA Editor SHALL convert the KRD workout to TCX XML format using the @kaiord/core library
9. WHEN THE user selects PWX format for export, THE Workout SPA Editor SHALL convert the KRD workout to PWX XML format using the @kaiord/core library
10. WHEN THE export conversion succeeds, THE Workout SPA Editor SHALL trigger a file download with the appropriate file extension

### Requirement 36.3 (Loading States)

**User Story:** As a user, I want to see loading indicators during file conversion, so that I know the application is processing my request

#### Acceptance Criteria

1. WHEN THE user imports a file, THE Workout SPA Editor SHALL display a loading spinner during conversion
2. WHEN THE conversion takes longer than 2 seconds, THE Workout SPA Editor SHALL display a progress bar
3. WHEN THE conversion is in progress, THE Workout SPA Editor SHALL disable the UI to prevent concurrent operations
4. WHEN THE conversion completes, THE Workout SPA Editor SHALL remove the loading indicator and enable the UI
5. WHEN THE conversion fails, THE Workout SPA Editor SHALL remove the loading indicator and display an error message

### Requirement 36.4 (Error Messages)

**User Story:** As a user, I want clear error messages when file conversion fails, so that I understand what went wrong and how to fix it

#### Acceptance Criteria

1. WHEN THE file format is not supported, THE Workout SPA Editor SHALL display an error message listing supported formats
2. WHEN THE FIT file is corrupted, THE Workout SPA Editor SHALL display an error message indicating the file cannot be parsed
3. WHEN THE TCX/PWX XML is invalid, THE Workout SPA Editor SHALL display an error message with the XML validation error
4. WHEN THE conversion fails due to unsupported features, THE Workout SPA Editor SHALL display a warning about data loss
5. WHEN THE export fails, THE Workout SPA Editor SHALL display an error message and offer to retry or export in a different format

### Requirement 39.1 (Success Notifications)

**User Story:** As a user, I want visual feedback when files are imported or exported successfully, so that I know the operation completed

#### Acceptance Criteria

1. WHEN THE user imports a file successfully, THE Workout SPA Editor SHALL display a success notification with the workout name
2. WHEN THE user exports a file successfully, THE Workout SPA Editor SHALL display a success notification with the format name
3. WHEN THE notification appears, THE Workout SPA Editor SHALL auto-dismiss it after 5 seconds
4. WHEN THE user clicks the notification, THE Workout SPA Editor SHALL dismiss it immediately
5. WHEN THE user performs multiple operations, THE Workout SPA Editor SHALL stack notifications vertically
