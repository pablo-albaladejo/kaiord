## ADDED Requirements

### Requirement: Sections of one file may sit in different register files

A claim id, a whole registered file, and each named section or locale key of a
file SHALL belong to one register file only. Different sections or keys of one
file MAY be registered in different register files, so that parallel tickets
edit different register files.

#### Scenario: Two registers hold different sections of the policy

- **WHEN** `claims/garmin.json` registers the Garmin section of the privacy policy and `claims/tanita.json` the Tanita section
- **THEN** `pnpm lint:claims` SHALL pass

#### Scenario: Two registers claim the same section

- **WHEN** a second register file names a section, or the whole file, that another register file already holds
- **THEN** `pnpm lint:claims` SHALL fail and name both register files
