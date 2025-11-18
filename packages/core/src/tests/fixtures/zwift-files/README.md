# Zwift Workout Test Fixtures

This directory contains sample Zwift workout files (.zwo format) used for testing the Zwift ↔ KRD conversion functionality.

## Fixture Files

### WorkoutSteadyState.zwo

Simple workout with SteadyState intervals demonstrating constant power targets.

### WorkoutIntervalsT.zwo

Workout with IntervalsT blocks demonstrating repeated on/off intervals.

### WorkoutRampIntervals.zwo

Workout with ramp intervals (Warmup, Ramp, Cooldown) demonstrating progressive power changes.

### WorkoutMixedIntervals.zwo

Complex workout combining multiple interval types (SteadyState, IntervalsT, Ramp, FreeRide).

### WorkoutTextEvents.zwo

Workout demonstrating text events (coaching cues) with time and distance offsets.

## Usage

These fixtures are used in:

- Round-trip conversion tests (Zwift → KRD → Zwift)
- Integration tests for Zwift reader/writer adapters
- Validation tests for XSD schema compliance

## Format

All files follow the Zwift workout file format (.zwo) as defined in `packages/core/schema/zwift-workout.xsd`.

Key characteristics:

- XML format with `workout_file` root element
- Power values as FTP percentage (0.0 to 3.0)
- Duration in seconds
- Pace in seconds per kilometer (for running)
- Cadence in RPM
