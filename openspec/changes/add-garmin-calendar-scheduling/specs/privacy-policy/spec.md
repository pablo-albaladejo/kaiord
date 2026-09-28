## ADDED Requirements

### Requirement: Garmin calendar placement disclosure

The Garmin Bridge section of the privacy policy SHALL disclose that, on the user's action, the extension places workouts on the user's Garmin Connect calendar (a write), removes the calendar entries Kaiord itself placed and has since superseded (a delete), and reads a month of the calendar to confirm an uncertain placement. It SHALL state that the calendar read is filtered inside the extension's service worker, so only the entries of the workout being placed — their schedule id and date — reach the Kaiord editor, and nothing is sent to a Kaiord-operated server. It SHALL state that library workouts are never deleted. The Chrome Web Store permission justification and store listing for `@kaiord/garmin-bridge` SHALL make the same disclosure.

#### Scenario: The policy discloses the calendar write, delete and read

- **WHEN** the Garmin Bridge section of the privacy policy is read
- **THEN** it SHALL describe the calendar write, the delete of superseded Kaiord-placed entries, and the on-device-filtered calendar read
