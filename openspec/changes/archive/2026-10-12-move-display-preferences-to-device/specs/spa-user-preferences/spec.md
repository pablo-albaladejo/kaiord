## ADDED Requirements

### Requirement: Language, units and notifications are device preferences

The SPA SHALL store `units`, `locale` and `notificationsEnabled` once per
browser, in localStorage under `kaiord-device-preferences`, and SHALL NOT key
them by profile. The device record SHALL NOT travel in the cloud snapshot.
Switching the active profile SHALL NOT change the language, the units or the
notifications choice.

On the first boot without a device record, the SPA SHALL copy these three
fields from the active profile's `userPreferences` row once; afterwards it
SHALL NOT read them from any profile. The legacy profile fields SHALL be kept
as they are, so older app versions syncing the same snapshot keep working.

When the storage accessor throws, reads and writes SHALL NOT fail: the values
SHALL be kept in memory for the session. An absent or `auto` locale SHALL
follow the browser language.

#### Scenario: Profile switch keeps language and units

- **GIVEN** the device is set to Spanish and Imperial
- **AND** profile B's legacy row says English and Metric
- **WHEN** profile B becomes active
- **THEN** the app stays in Spanish and shows imperial units

#### Scenario: First boot seeds from the active profile

- **GIVEN** no device record exists
- **AND** the active profile's row says Spanish and Imperial
- **WHEN** the app boots
- **THEN** the device record is created with Spanish and Imperial

#### Scenario: An existing device record is not overwritten

- **GIVEN** the device record says English and Metric
- **WHEN** the app boots with an active profile whose row says Spanish and Imperial
- **THEN** the device record is unchanged

#### Scenario: Storage unavailable

- **GIVEN** the storage accessor throws
- **WHEN** the user picks Imperial
- **THEN** the app shows imperial units for the rest of the session
