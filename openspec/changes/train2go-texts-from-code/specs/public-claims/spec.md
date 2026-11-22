## ADDED Requirements

### Requirement: Sections of one shared file may belong to different register files

A register file SHALL own a whole file, or named sections or locale keys of
one. Two register files MAY own different sections of the same file. The
guard SHALL fail when a section or key is owned by two register files, and
when a whole file is registered while any of its sections is owned by another
register file.

#### Scenario: Two extensions register their own policy sections

- **WHEN** `claims/garmin.json` owns the Garmin section of the privacy policy and `claims/train2go.json` owns the Train2Go section
- **THEN** `pnpm lint:claims` SHALL pass

#### Scenario: The same section is registered twice

- **WHEN** two register files name the same section of one file
- **THEN** `pnpm lint:claims` SHALL fail and name the file, the section and the first owner

### Requirement: Kaiord for Train2Go texts are registered

Kaiord for Train2Go's texts SHALL be registered surfaces in `claims/train2go.json`:
its `extDescription`, the Short and Detailed Description of its store listing,
its permission justifications and its privacy-policy section. They SHALL state that the
extension stores no password, cookie or token, that every request goes to
`app.train2go.com` with the athlete's own cookie and is a `GET`, and that each
connection check hands the Kaiord App the coach's name and notes, proven by a
test at the message contract.

#### Scenario: A request leaves Train2Go

- **WHEN** any external action makes the service worker request a host other than `app.train2go.com`, send a credential header, or use a method other than `GET`
- **THEN** `request-confinement.test.js` SHALL fail
