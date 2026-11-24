## ADDED Requirements

### Requirement: Kaiord for TrainingPeaks is a thin Bridge

Kaiord for TrainingPeaks SHALL speak protocol version 2 and answer the Kaiord App's reads and writes only through `{ action: "request", method, path, body? }` on its closed list: the metrics range read for two dates, the weight write (body `weight`), the planned-workout write (body `workout`, a new workout only), the read of one workout by id, and the read of the workouts of one day (start and end the same date). The token endpoint SHALL NOT be on the list. It SHALL answer TrainingPeaks' raw answer unread, mint its token only for a real request or `read-athlete-id`, no longer serve `read-metrics`, `push-weight`, `push-workout` or `read-workout`, and answer its internal channel only to its popup (`checkSession`).

#### Scenario: The token endpoint is refused to the App

- **GIVEN** a held token
- **WHEN** the App asks for `GET /users/v3/token`
- **THEN** the answer is `Request not allowed`, nothing is sent and no answer carries the token
