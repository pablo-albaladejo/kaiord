## ADDED Requirements

### Requirement: Train2Go status in Settings panel

The Settings "Extensions" tab SHALL display a "Train2Go Bridge Extension" section below the Garmin Bridge section. The section SHALL show the current detection and session state of the Train2Go Bridge extension.

#### Scenario: Train2Go extension not installed

- **WHEN** the Train2Go extension is not detected
- **THEN** the section shows a message that the Train2Go Bridge extension is not detected, with install instructions

#### Scenario: Train2Go extension installed but no session

- **WHEN** the Train2Go extension is detected but `sessionActive` is false
- **THEN** the section shows "Extension detected but Train2Go session is not active. Open Train2Go in another tab and log in."

#### Scenario: Train2Go extension installed and session active

- **WHEN** the Train2Go extension is detected and `sessionActive` is true
- **THEN** the section shows a green "Connected to Train2Go" message

#### Scenario: Refresh status button

- **WHEN** the user clicks "Refresh Status" in the Train2Go section
- **THEN** the SPA re-runs Train2Go extension detection and updates the displayed status

### Requirement: Platform-inclusive copy in empty states

The FirstVisitState Connect card and NoBridgesState warning SHALL reference both Garmin Connect and Train2Go, not just Garmin Connect.

#### Scenario: FirstVisitState Connect card

- **WHEN** the calendar shows the first-visit onboarding state
- **THEN** the Connect card description SHALL read "Link Garmin Connect, Train2Go, or other platforms"

#### Scenario: NoBridgesState message

- **WHEN** no bridge extensions are detected
- **THEN** the message SHALL read "Install a bridge extension (e.g., Garmin Connect, Train2Go) to sync workouts."
