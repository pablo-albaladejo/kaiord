## ADDED Requirements

### Requirement: Garmin GCN Writer Resolves Percent-Of-FTP Power Targets With A Provided FTP

The Garmin GCN writer SHALL write a KRD `percent_ftp` power target as a `power.zone` target in watts, computed as `round(percent / 100 × ftpWatts)`, where `ftpWatts` is supplied by the caller through the writer options. When no FTP is provided, or the FTP is zero, negative or not finite, the writer SHALL throw the typed `MissingFtpError` from `@kaiord/core` and SHALL NOT substitute an assumed FTP. Watts targets, watt ranges (faster-first) and power zones SHALL be written unchanged.

#### Scenario: Percent of FTP resolved with the athlete FTP

- **GIVEN** a cycling step with a `percent_ftp` power target of 85
- **WHEN** the GCN writer emits the step with `ftpWatts: 250`
- **THEN** the emitted JSON has `targetValueOne: 213` and `targetValueTwo: 213`

#### Scenario: Missing FTP fails loudly

- **GIVEN** a cycling step with a `percent_ftp` power target
- **WHEN** the GCN writer emits the step without `ftpWatts`
- **THEN** the writer throws `MissingFtpError` and produces no GCN output

#### Scenario: Watts targets need no FTP

- **GIVEN** a cycling step with a power range of 125–188 W
- **WHEN** the GCN writer emits the step with any FTP or none
- **THEN** the emitted JSON has `targetValueOne: 188` and `targetValueTwo: 125`
