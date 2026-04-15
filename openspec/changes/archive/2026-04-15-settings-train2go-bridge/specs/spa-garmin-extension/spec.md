## MODIFIED Requirements

### Requirement: Extension install prompt

When the extension is not installed, the SPA SHALL display a prompt to install the Kaiord Garmin Bridge extension with a link to the installation source. The prompt SHALL include manual install instructions (load unpacked from GitHub release) since Web Store is not yet available. The message SHALL say "installed AND enabled" to cover the case where the extension is disabled.

The Settings tab containing this prompt SHALL be labeled "Extensions" (previously "Garmin") to reflect that it hosts multiple bridge extension statuses.

#### Scenario: User sees install prompt

- **WHEN** the SPA detects the extension is not installed
- **THEN** the Extensions tab shows a "Garmin Bridge Extension" section with an install prompt instead of push/list controls

#### Scenario: Settings tab label

- **WHEN** the user opens Settings
- **THEN** the tab is labeled "Extensions" (not "Garmin")
