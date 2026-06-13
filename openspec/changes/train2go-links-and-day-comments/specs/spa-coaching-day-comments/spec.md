<!--
Capability scope (lifted to `## Purpose` when this delta archives into
`openspec/specs/spa-coaching-day-comments/spec.md`):

`spa-coaching-day-comments` covers the day-scoped coach/athlete comment
threads imported from coaching platforms: the persisted record shape,
the wholesale-replace sync semantics tied to the existing `read-day`
lazy fetch, profile-scoped lifecycle (cascade delete), and the
read-only display with safe linkified bodies.
-->

## ADDED Requirements

### Requirement: CoachingDayNotesRecord shape

The SPA SHALL persist day-scoped comment threads in a dedicated Dexie table `coachingDayNotes` whose record shape is validated by a Zod schema:

- `id` (string): the composite `${profileId}:${source}:${date}` — same convention as `coachingActivities.id`, with `date` taking the place of `sourceId`
- `profileId` (string), `source` (string), `date` (string, `YYYY-MM-DD`)
- `comments` (array, possibly empty), each entry:
  - `author` (string) — display name only
  - `isOwn` (boolean) — whether the linked athlete wrote it
  - `timestamp` (string) — ISO-parseable datetime from the platform
  - `text` (string) — plain text; links encoded as markdown `[label](url)`; paragraphs separated by newlines
- `fetchedAt` (ISO datetime string)

The record MUST NOT store avatar image URLs or any field beyond the list above. The schema SHALL refine that `id` equals `${profileId}:${source}:${date}`.

#### Scenario: Valid record round-trips through the schema

- **WHEN** a record `{ id: "p1:train2go:2026-06-07", profileId: "p1", source: "train2go", date: "2026-06-07", comments: [{ author: "Daniel Blanco Galindo", isOwn: false, timestamp: "2026-06-01 17:26:22", text: "Notas recordatorio…" }], fetchedAt: "2026-06-12T10:00:00.000Z" }` is parsed by the schema
- **THEN** parsing succeeds and the value is unchanged

#### Scenario: Mismatched composite id is rejected

- **WHEN** a record with `id: "p1:train2go:2026-06-08"` but `date: "2026-06-07"` is parsed
- **THEN** schema validation fails

#### Scenario: Profile cascade delete removes day notes

- **GIVEN** profile P has persisted `coachingDayNotes` rows
- **WHEN** profile P is deleted via the existing delete-profile-with-cascade use case
- **THEN** all `coachingDayNotes` rows with `profileId = P` are removed along with the profile's other coaching data

### Requirement: Day comments sync via read-day

When a `read-day` bridge call succeeds, the SPA SHALL map the response's `comments` array into a `CoachingDayNotesRecord` and upsert it, replacing any existing record for the same `${profileId}:${source}:${date}` wholesale (no per-comment merging). An empty `comments` array SHALL be persisted as an empty thread (so a thread deleted upstream empties locally on next fetch). A `read-day` response without a `comments` field (older bridge version) SHALL leave existing local day notes untouched.

A failure while mapping or persisting comments MUST NOT prevent or roll back the activities upsert from the same `read-day` response; the failure SHALL be logged with a static message that does not interpolate comment content.

#### Scenario: Comments persisted on day expansion

- **GIVEN** profile P linked to `train2go` and a day with 3 comments upstream
- **WHEN** the user opens that day's activity detail and the `read-day` response arrives with `comments: [c1, c2, c3]`
- **THEN** a `coachingDayNotes` record for that date is upserted with exactly those 3 entries in order, and `fetchedAt` is refreshed

#### Scenario: Re-fetch replaces the thread wholesale

- **GIVEN** a persisted record with 2 comments for 2026-06-07
- **WHEN** a later `read-day` for 2026-06-07 returns 5 comments
- **THEN** the persisted record contains exactly the 5 new entries (no duplicates of the old 2)

#### Scenario: Older bridge without comments field

- **GIVEN** a persisted record with 2 comments for 2026-06-07
- **WHEN** a `read-day` response for 2026-06-07 arrives with no `comments` key
- **THEN** the persisted record is left unchanged and the activities from the response are upserted normally

#### Scenario: Comments persistence failure does not break activity sync

- **WHEN** the `coachingDayNotes` upsert throws during a `read-day` flow
- **THEN** the activities from the same response are still upserted and the dialog renders their descriptions; the error is logged with a static message

### Requirement: Day comments display

The coaching activity detail view SHALL render a read-only comments panel for the activity's date, populated via a `useLiveQuery` on `coachingDayNotes` keyed by `${profileId}:${source}:${date}`. Each comment SHALL show the author name, a localized timestamp (rendered with `Intl.DateTimeFormat` from the stored value), and the body rendered through the shared safe-linkification formatter (per `spa-coaching-integration`). `isOwn` MAY drive visual distinction (e.g., alignment) only.

When no record exists for the date, or the record's `comments` array is empty, the panel SHALL NOT render. The panel is read-only: the SPA SHALL NOT offer composing, editing, or deleting comments. Comment content MUST NOT appear in toasts or `console.*` arguments.

#### Scenario: Thread renders with author, time, and linkified body

- **GIVEN** a persisted record for 2026-06-07 whose first comment is `{ author: "Pablo Albaladejo", isOwn: true, timestamp: "2026-06-07 22:55:38", text: "[connect.garmin.com](https://connect.garmin.com/app/activity/23160614260)" }`
- **WHEN** the user opens an activity dated 2026-06-07
- **THEN** the panel shows "Pablo Albaladejo", a localized rendering of the timestamp, and an anchor to `https://connect.garmin.com/app/activity/23160614260` with `target="_blank"` and `rel="noopener noreferrer"`

#### Scenario: No panel for a day without comments

- **WHEN** the user opens an activity whose date has no `coachingDayNotes` record (or an empty `comments` array)
- **THEN** no comments panel renders; the dialog layout is unchanged from pre-change behavior

#### Scenario: Panel updates reactively after sync

- **GIVEN** an open activity dialog for 2026-06-07 with 2 comments displayed
- **WHEN** a background `read-day` upserts a thread with 3 comments for that date
- **THEN** the panel re-renders showing 3 comments without reopening the dialog
