## ADDED Requirements

### Requirement: Train2Go Connector reads Train2Go's raw answers

The App's Train2Go Connector (`src/adapters/train2go/connector/`) SHALL decide what to ask Train2Go for and SHALL read Train2Go's raw answers. It SHALL ask, with `{ action: "request", method: "GET", path }`, only for:

- the week: `/api/v2/workplan/weekly/{date}?user={id}`, a JSON answer whose `data.replace["#workplan"]` HTML yields, per activity, `id`, `date` (from the day cell's `workplan-table-date-{YYYY-MM-DD}` class), `sport`, `title` (entities decoded), `duration`, `workload` and `status`;
- one day: `/api/v2/workplan/daily/{date}?user={id}&source=sidebar`, a JSON answer whose `data.content` HTML yields the weekly fields plus `description` (`<strong>` as `**`, `<a href>` as `[label](url)`, block tags as new lines, other tags stripped) and `completion`, with `date` set to the date asked for, and the day's comment thread (`author`, `isOwn`, `timestamp`, `text`, in DOM order, never an avatar URL);
- zones and weight: `/user/details`, an HTML answer (see the allowlist requirement).

Every path it builds SHALL be admitted by the extension's closed list. A body that is not what Train2Go sends SHALL yield `{ ok: false, error: "Malformed response body" }`, never an exception. The answers' shapes returned to the use cases SHALL be the ones the extension returned before (`{ activities }`, `{ activities, comments }`, the zones payload).

#### Scenario: Read a week

- **WHEN** the extension answers the weekly request with Train2Go's JSON
- **THEN** `readWeek` returns `{ ok: true, data: { activities: [{ id, date, sport, title, duration, workload, status }, …] } }`

#### Scenario: A day's activities take the date asked for

- **WHEN** the daily fragment, which carries no date, is read for `2026-04-13`
- **THEN** every returned activity has `date: "2026-04-13"`

#### Scenario: Every asked path is on the extension's list

- **WHEN** the paths for a week, a day and the profile page are built
- **THEN** each matches a rule of `ALLOWED` in `packages/train2go-bridge/background.js`

### Requirement: Train2Go Connector keeps only zones and weight from the profile page

The Connector's `parseDetailsHtml` SHALL emit only `physiological.{weight, bpmMax, bpmRest}`, `paces.cycling` (watts bands, `z4Upper`, `z5Lower`), `paces.{running, swimming}` (`{min, sec}` bands, `z4Upper`) and `hrZones.{generic, cycling, running, swimming}` (bands, `z4Upper`), and the result SHALL then be validated by `zonesPayloadSchema`. Gender, birthday, body fat, smoker, IMC, the coach's notes and contact, email, records and tests on the page SHALL be dropped as it is read; a recursive key walk test SHALL assert none appears at any depth. The raw page SHALL NOT be stored.

#### Scenario: Private fields of the page never leave the reader

- **GIVEN** the live-shape `/user/details` fixture, which holds birthday, gender, email and records
- **WHEN** the Connector reads it
- **THEN** the result has only the keys `physiological`, `paces` and `hrZones`, and none of the forbidden keys at any depth

### Requirement: Train2Go Connector accepts the previous protocol

Every read SHALL first be sent as `request`. When the answer's envelope carries `protocolVersion: 1`, the Connector SHALL send the same read as the protocol-1 action (`read-week` `{ date, userId }`, `read-day` `{ date, userId }`, `read-details` `{ externalUserId }`) and return that answer unchanged. The version SHALL be read from each answer, with no stored state.

#### Scenario: An extension one protocol version behind keeps working

- **GIVEN** an extension on protocol 1, which refuses `request` with `{ ok: false, protocolVersion: 1 }`
- **WHEN** the App reads a week, a day and the zones
- **THEN** each read is sent again as `read-week`, `read-day` and `read-details`, and the extension's parsed answers are returned
