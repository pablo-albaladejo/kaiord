## MODIFIED Requirements

### Requirement: Action tools require explicit confirmation

Action tools (v1: trigger a coaching sync, create a workout from a description, log a manual health metric) SHALL NOT execute when the model calls them. The engine SHALL pause the turn and surface a pending-action card showing the tool name and validated input in human-readable form; only an explicit user approval SHALL execute the underlying existing use case, after which the turn resumes with the real result. A denial SHALL resume the turn with a "user declined" tool result. Action tools SHALL wrap existing audited use cases 1:1 and SHALL NOT introduce new write paths.

A confirmed create-workout result SHALL be reported in the transcript as a
rendered session — its title, its dominant-zone lateral border, its zone
profile bar and its headline metrics — and not only as a link to open it
elsewhere. When the target date already holds a persisted session, the rendered
result SHALL state that session and show its duration and load beneath the
proposal's own, as a before/after. The report SHALL NOT claim to have replaced
that session: the create-workout write path persists a new record and removes
nothing.

#### Scenario: Confirmed workout creation

- **WHEN** the user asks for "a relaxed ride for today", the model calls the create-workout tool, and the user approves the pending-action card
- **THEN** the workout SHALL be generated through the existing text-to-workout pipeline and persisted through the existing workout persistence use case for today's date, and the assistant SHALL report the created workout in the conversation as a rendered session card

#### Scenario: The reported session compares itself to the day it lands on

- **GIVEN** the target date already holds a persisted session
- **WHEN** the confirmed create-workout result is rendered in the transcript
- **THEN** the card SHALL name that session and render its duration and TSS beneath the new session's own, and SHALL NOT describe the new session as replacing it

#### Scenario: Declined action

- **WHEN** the model calls an action tool and the user declines the pending-action card
- **THEN** no use case SHALL execute, and the model SHALL receive a declined tool result and respond without performing the action

#### Scenario: Coaching sync triggered from chat

- **WHEN** the user asks to "sync with Train2Go", the model calls the coaching sync tool, and the user approves
- **THEN** the same use case behind the calendar's Train2Go sync SHALL run, and its outcome (including extension-not-connected errors) SHALL be reported as the tool result in the conversation

#### Scenario: Sleep logged from chat

- **WHEN** the user says "I slept 7 hours today", the model calls the health metric tool with sleep duration for today, and the user approves
- **THEN** the existing manual health metric use case SHALL persist the sleep record for today and the calendar/health surfaces SHALL reflect it reactively
