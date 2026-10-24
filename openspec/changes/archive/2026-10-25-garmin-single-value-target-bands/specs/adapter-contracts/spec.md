## ADDED Requirements

### Requirement: Garmin GCN Writer Sends Single-Value Targets As Tolerance Bands

The Garmin GCN writer SHALL NOT emit a zero-width target. A single pace, power, heart-rate or cadence value SHALL be written as a symmetric band around it:

- pace ±5 s/km;
- power ±5 %, and never narrower than ±5 W, in integer watts;
- heart rate ±3 bpm, in integer bpm;
- cadence ±3, as an integer.

For integer bands, the centre and the half-width SHALL be rounded separately, so the band stays symmetric around the rounded target. Bounds SHALL be clamped to the KRD schema range: 0–30 m/s, 0–5000 W, 0–300 bpm and 0–300 rpm. Power and pace SHALL be written higher value first; heart rate and cadence lowest first. Ranges and zones SHALL be written unchanged.

#### Scenario: Single power value written as a ±5 % band

- **GIVEN** a cycling step with a single power target of 200 W
- **WHEN** the GCN writer emits the step
- **THEN** the emitted JSON has `targetValueOne: 210` and `targetValueTwo: 190`

#### Scenario: Low power value keeps a ±5 W band

- **GIVEN** a cycling step with a single power target of 80 W
- **WHEN** the GCN writer emits the step
- **THEN** the emitted JSON has `targetValueOne: 85` and `targetValueTwo: 75`

#### Scenario: Single heart rate written as a ±3 bpm band

- **GIVEN** a step with a single heart-rate target of 150 bpm
- **WHEN** the GCN writer emits the step
- **THEN** the emitted JSON has `targetValueOne: 147` and `targetValueTwo: 153`

#### Scenario: Single cadence written as a ±3 band

- **GIVEN** a step with a single cadence target of 90
- **WHEN** the GCN writer emits the step
- **THEN** the emitted JSON has `targetValueOne: 87` and `targetValueTwo: 93`

#### Scenario: A band at the schema maximum is clamped

- **GIVEN** a step with a single heart-rate target of 299 bpm
- **WHEN** the GCN writer emits the step
- **THEN** the emitted JSON has `targetValueOne: 296` and `targetValueTwo: 300`

### Requirement: Garmin GCN Writer Resolves Percent-Of-Max-Heart-Rate Targets With A Provided Max Heart Rate

The Garmin GCN writer SHALL write a KRD `percent_max` heart-rate target as `heart.rate.zone` bpm, computed as `round(percent / 100 × maxHeartRate)`, where `maxHeartRate` is supplied by the caller through the writer options. It SHALL then write the result as a single-value band.

The writer SHALL throw the typed `MissingMaxHeartRateError` from `@kaiord/core`, and SHALL NOT substitute an assumed value, when the max heart rate is:

- not provided;
- not finite;
- below 100 bpm;
- above 300 bpm.

A `percent_max` target that resolves outside 1–300 bpm SHALL throw `KrdValidationError`. It SHALL NOT be written as 0 bpm or clamped into a zero-width band.

#### Scenario: Percent of max HR resolved with the athlete max HR

- **GIVEN** a step with a `percent_max` heart-rate target of 85
- **WHEN** the GCN writer emits the step with `maxHeartRate: 190`
- **THEN** the step resolves to 162 bpm and the emitted JSON has `targetValueOne: 159` and `targetValueTwo: 165`

#### Scenario: Missing max HR fails loudly

- **GIVEN** a step with a `percent_max` heart-rate target
- **WHEN** the GCN writer emits the step without `maxHeartRate`
- **THEN** the writer throws `MissingMaxHeartRateError` and produces no GCN output

#### Scenario: Implausible max HR is refused like a missing one

- **GIVEN** a step with a `percent_max` heart-rate target of 85
- **WHEN** the GCN writer emits the step with `maxHeartRate: 400`
- **THEN** the writer throws `MissingMaxHeartRateError` instead of writing a clamped 300–300 bpm target

#### Scenario: A target resolving out of range is rejected

- **GIVEN** a step with a `percent_max` heart-rate target of 0
- **WHEN** the GCN writer emits the step with `maxHeartRate: 190`
- **THEN** the writer throws `KrdValidationError` instead of writing a 0 bpm target

## MODIFIED Requirements

### Requirement: Garmin GCN Writer Resolves Percent-Of-FTP Power Targets With A Provided FTP

The Garmin GCN writer SHALL write a KRD `percent_ftp` power target as a `power.zone` target in watts, computed as `round(percent / 100 × ftpWatts)`, where `ftpWatts` is supplied by the caller through the writer options. A power `range` with `basis: "percent_ftp"` SHALL have both bounds resolved the same way and be written faster-first. When no FTP is provided, or the FTP is zero, negative or not finite, the writer SHALL throw the typed `MissingFtpError` from `@kaiord/core` and SHALL NOT substitute an assumed FTP. Watts targets, watt ranges (no `basis`, faster-first) and power zones SHALL be written unchanged.

#### Scenario: Percent of FTP resolved with the athlete FTP

- **GIVEN** a cycling step with a `percent_ftp` power target of 85
- **WHEN** the GCN writer emits the step with `ftpWatts: 250`
- **THEN** the step resolves to 213 W and, as a single value, is written as its band: `targetValueOne: 224` and `targetValueTwo: 202`

#### Scenario: Percent-of-FTP range resolved with the athlete FTP

- **GIVEN** a cycling step with a power range of 50–75 and `basis: "percent_ftp"`
- **WHEN** the GCN writer emits the step with `ftpWatts: 250`
- **THEN** the emitted JSON has `targetValueOne: 188` and `targetValueTwo: 125`

#### Scenario: Missing FTP fails loudly

- **GIVEN** a cycling step with a `percent_ftp` power target
- **WHEN** the GCN writer emits the step without `ftpWatts`
- **THEN** the writer throws `MissingFtpError` and produces no GCN output

#### Scenario: Watts targets need no FTP

- **GIVEN** a cycling step with a power range of 125–188 W
- **WHEN** the GCN writer emits the step with any FTP or none
- **THEN** the emitted JSON has `targetValueOne: 188` and `targetValueTwo: 125`
