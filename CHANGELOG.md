# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Priority 1: Workout Metadata & Step Notes

- **Sub-sport field support**: Workouts now support the `subSport` field for more detailed sport categorization (e.g., "trail" for running, "indoor_cycling" for cycling)
  - FIT → KRD: Maps `sub_sport` from FIT Workout message to KRD `subSport`
  - KRD → FIT: Maps KRD `subSport` to FIT `sub_sport` field
  - Round-trip safe with exact value preservation
  - Validates against Garmin FIT sub-sport enumeration

- **Workout step notes**: Steps now support the `notes` field for coaching cues and instructions
  - FIT → KRD: Maps `notes` from FIT WorkoutStep message to KRD `notes`
  - KRD → FIT: Maps KRD `notes` to FIT `notes` field
  - Maximum length: 256 characters
  - Round-trip safe with exact text preservation

#### Priority 2: Swimming Workouts

- **Pool length support**: Swimming workouts now support pool dimensions
  - `poolLength`: Pool length in meters
  - `poolLengthUnit`: Always "meters" in KRD (converted from FIT units)
  - Automatic unit conversion from yards to meters
  - Round-trip safe within ±0.01m tolerance

- **Equipment field support**: Workout steps now support swimming equipment specification
  - Supported equipment: swim_fins, swim_kickboard, swim_paddles, swim_pull_buoy, swim_snorkel
  - FIT → KRD: Maps equipment from FIT WorkoutStep to KRD
  - KRD → FIT: Maps KRD equipment to FIT format
  - Validates against Garmin FIT equipment enumeration

#### Priority 2: Advanced Duration Types

- **Calorie-based durations**:
  - `calories`: Step ends after burning specified calories
  - `repeat_until_calories`: Repeat block until total calories reached

- **Power-based durations**:
  - `power_less_than`: Step ends when power drops below threshold
  - `power_greater_than`: Step ends when power exceeds threshold
  - `repeat_until_power_less_than`: Repeat until power drops below threshold
  - `repeat_until_power_greater_than`: Repeat until power exceeds threshold

- **Additional repeat conditionals**:
  - `repeat_until_time`: Repeat until cumulative time reached
  - `repeat_until_distance`: Repeat until cumulative distance reached
  - `repeat_until_heart_rate_less_than`: Repeat until heart rate drops below threshold

### Changed

- **Duration type naming consistency**: Renamed `heart_rate_greater_than` to `repeat_until_heart_rate_greater_than` for consistency with other repeat conditional types
  - Old naming still supported for backward compatibility (deprecated)
  - New conversions from FIT always use the new naming
  - Migration guide available in documentation

### Technical Improvements

- Enhanced schema validation with new optional fields
- Improved round-trip safety for all new fields
- Comprehensive test coverage for new duration types and fields
- Updated JSON Schema generation to include all new fields

## [1.0.0] - 2025-01-15

### Added

- Initial release of Kaiord
- FIT file format support (read/write)
- KRD canonical format
- Schema validation with AJV
- Round-trip safe conversions
- CLI tool for format conversion
- Hexagonal architecture with ports/adapters
- Comprehensive test coverage

[Unreleased]: https://github.com/yourusername/kaiord/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/kaiord/releases/tag/v1.0.0
