## ADDED Requirements

### Requirement: Kaiord for Garmin is a thin Bridge

Kaiord for Garmin SHALL speak protocol version 2 and answer the Kaiord App's reads and writes only through `{ action: "request", method, path, body? }`, running only an entry of its closed list: the workout list and the activities search with `start` and `limit`; the workout write (body `workout`); the FIT upload at `/upload-service/upload/.fit` (body `fit-file`); the schedule write (body `schedule`) and delete by canonical id; and one calendar month. It SHALL answer Garmin's raw answer `{ status, contentType, body }` unread, run every request under one deadline with no write started after the send cut-off, and mint its tokens only before a real request. It SHALL no longer serve `list`, `push`, `activities`, `push-body-composition`, `schedule`, `unschedule` or `calendar-find`, and SHALL answer its internal channel only to its popup (`ping`).

#### Scenario: A path outside the list is refused without a token

- **GIVEN** no token is held
- **WHEN** the App asks for `GET /userprofile-service/socialProfile`
- **THEN** the answer is `Request not allowed`, no request is sent and no token is minted

#### Scenario: The calendar month is handed over unread

- **GIVEN** a held token
- **WHEN** the App asks for `GET /calendar-service/year/2026/month/9`
- **THEN** the answer carries Garmin's month as Garmin sent it
