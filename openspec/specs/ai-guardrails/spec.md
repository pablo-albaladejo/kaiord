> Synced: 2026-09-08 (harden-ai-evals)

# ai-guardrails Specification

## Purpose

Containment for text the application did not author. Coach-authored plans
synced from a coaching platform, names and notes arriving with imported workout
files, and exception strings from external services all reach a model, and a
model cannot tell data from instruction on its own. This capability governs the
one defense that runs before it can: wrapping such text in a delimiter the text
itself cannot terminate, and proving — keylessly, on every commit — that every
field which should be wrapped is.

It is deliberately not the only control. A fence is mitigation, not a
guarantee: the model may disobey the instruction even with the delimiter
intact. The second layer is the confirmation gate on the action tools, which
means a fence breakout produces a convincing petitioner rather than an
executed action.

## Requirements

### Requirement: The fence cannot be terminated by its own payload

The untrusted-data fence SHALL neutralize any fence delimiter carried by the
text it wraps, before wrapping it. Neutralization SHALL be closed under
concatenation: removing or replacing a delimiter SHALL NOT allow the surrounding
text to re-form one. The fenced output SHALL contain exactly one opening
delimiter, at the start, and exactly one closing delimiter, at the end.

#### Scenario: Payload carrying the closing delimiter

- **GIVEN** external text containing the closing fence delimiter followed by an instruction
- **WHEN** the text is fenced
- **THEN** the output SHALL contain exactly one closing delimiter and it SHALL be the final characters of the output

#### Scenario: A delimiter split around a neutralized one

- **GIVEN** external text in which the halves of a delimiter surround a complete delimiter, so that deleting the inner one would splice the halves into a valid delimiter
- **WHEN** the text is fenced
- **THEN** the output SHALL still contain exactly one closing delimiter

#### Scenario: Ordinary text is unaffected

- **GIVEN** external text carrying no fence delimiter
- **WHEN** the text is fenced
- **THEN** the wrapped content SHALL be the original text, subject only to the existing length cap

### Requirement: Every externally-authored field reaching a model is fenced

Any field whose value originates outside the application — coach-authored text
synced from a coaching platform, and names and notes arriving with imported
workout files or platform sync — SHALL be fenced before it is serialized into a
prompt or a tool result. A field that is absent SHALL remain distinguishable
from a field that is present and empty.

#### Scenario: Imported workout names are fenced

- **GIVEN** a workout whose name arrived with an imported file or a platform sync
- **WHEN** the workout is summarized for a model-facing tool result
- **THEN** the name SHALL be fenced

#### Scenario: Absence survives fencing

- **GIVEN** a workout with no name
- **WHEN** it is summarized
- **THEN** the name SHALL remain null rather than becoming an empty fenced string

### Requirement: A mechanical guard detects the next unfenced field

The repository SHALL carry a guard that fails when a model-facing summarizer
returns a declared externally-authored field that is not assigned from a fencing
call. The guard SHALL run in the same lane as the repository's other mechanical
guards, and SHALL declare the set of field names it recognizes so that the
limits of its coverage are visible.

#### Scenario: An unfenced field fails the guard

- **GIVEN** a model-facing summarizer that returns a recognized externally-authored field assigned directly from its source
- **WHEN** the guard runs
- **THEN** it SHALL fail and name the file and the field

#### Scenario: The guard states what it does not cover

- **WHEN** the guard is inspected
- **THEN** the set of field names it recognizes SHALL be declared in one place, so that a field name outside the set is a known gap rather than a silent one

### Requirement: Containment is proven without provider credentials

The suite proving the two containment obligations SHALL be deterministic and
SHALL run without any provider API key, as part of the standard test run, so
that containment is gated on every commit rather than on a manually dispatched
paid lane.

#### Scenario: Containment gates a commit

- **GIVEN** a CI environment with no provider API keys
- **WHEN** the standard test suite runs
- **THEN** the containment suite SHALL execute and SHALL fail the build on a regression in either obligation
