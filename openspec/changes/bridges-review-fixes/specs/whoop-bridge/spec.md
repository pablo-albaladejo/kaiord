## ADDED Requirements

### Requirement: The content script keeps the same closed list

The WHOOP content script, which runs each read from the open `app.whoop.com`
tab, SHALL hold its own allowlist of read paths, equal to the service
worker's closed list `ALLOWED`, and SHALL refuse any other path with no
request sent. A parity test SHALL hold the two lists equal.

#### Scenario: A read off the list reaches the tab

- **WHEN** the content script is asked to fetch a WHOOP API path not in the list
- **THEN** it refuses it and sends no request
